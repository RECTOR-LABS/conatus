import http, { type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { pathToFileURL, fileURLToPath } from "node:url";
import { z } from "zod";
import { createJobStore, QueueFullError, type Job, type JobStore, type StageRunner } from "./jobs";
import { runAudit } from "./audit/runAudit";
import { synthesizeAudit } from "./synthesis";
import { anchorAttestation } from "./anchor";
import { MANTLE_SEPOLIA_ID, MANTLE_MAINNET_ID } from "./chain";

const VERSION = "0.1.0";
const MAX_SOURCE_CHARS = 100_000;
const MAX_BODY_BYTES = 512 * 1024;

const AuditRequest = z.object({
  source: z.string().min(1, "source is required").max(MAX_SOURCE_CHARS, "source exceeds 100k chars"),
  contractName: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,63}$/, "contractName must be a valid identifier").optional(),
  anchor: z.boolean().optional(),
});

export interface RateLimitOptions {
  capacity: number;
  /** Tokens regained per millisecond (5 per 10 min ≈ 0.0000083). */
  refillPerMs: number;
}

export interface ServerOptions {
  store: JobStore;
  token: string;
  allowedOrigin: string;
  agentId: string;
  chainId: number;
  rateLimit?: RateLimitOptions;
}

function tokenMatches(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function clientIp(req: IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0];
  return (first ?? req.socket.remoteAddress ?? "unknown").trim();
}

function makeRateLimiter(opts: RateLimitOptions) {
  const buckets = new Map<string, { tokens: number; last: number }>();
  return (ip: string): boolean => {
    const nowMs = Date.now();
    const b = buckets.get(ip) ?? { tokens: opts.capacity, last: nowMs };
    b.tokens = Math.min(opts.capacity, b.tokens + (nowMs - b.last) * opts.refillPerMs);
    b.last = nowMs;
    if (b.tokens < 1) {
      buckets.set(ip, b);
      return false;
    }
    b.tokens -= 1;
    buckets.set(ip, b);
    return true;
  };
}

/** Public job view — never echoes the submitted source back. */
function jobToResponse(job: Job) {
  return {
    id: job.id,
    status: job.status,
    contractName: job.contractName,
    anchor: job.anchor,
    createdAt: job.createdAt,
    ...(job.report ? { report: job.report } : {}),
    ...(job.anchorResult ? { anchorResult: job.anchorResult } : {}),
    ...(job.error ? { error: job.error } : {}),
  };
}

export function createServer(opts: ServerOptions): Server {
  const allow = opts.rateLimit ? makeRateLimiter(opts.rateLimit) : () => true;

  return http.createServer((req: IncomingMessage, res: ServerResponse) => {
    const send = (status: number, body: unknown): void => {
      res.writeHead(status, {
        "content-type": "application/json",
        "access-control-allow-origin": opts.allowedOrigin,
        "access-control-allow-headers": "content-type, x-api-token",
        "access-control-allow-methods": "GET, POST, OPTIONS",
      });
      res.end(JSON.stringify(body));
    };

    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": opts.allowedOrigin,
        "access-control-allow-headers": "content-type, x-api-token",
        "access-control-allow-methods": "GET, POST, OPTIONS",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/healthz") {
      send(200, { ok: true, version: VERSION, agentId: opts.agentId, chainId: opts.chainId });
      return;
    }

    if (!url.pathname.startsWith("/audits")) {
      send(404, { error: `Unknown path ${url.pathname} — expected /audits, /audits/:id, or /healthz.` });
      return;
    }

    if (!tokenMatches(req.headers["x-api-token"] as string | undefined, opts.token)) {
      send(401, { error: "Missing or invalid X-API-Token header." });
      return;
    }

    if (req.method === "GET") {
      const id = url.pathname.split("/")[2];
      if (!id) {
        send(400, { error: "Job id required: GET /audits/:id" });
        return;
      }
      const job = opts.store.get(id);
      if (!job) {
        send(404, { error: `No job ${id} — it may have expired (jobs are kept ~1h).` });
        return;
      }
      send(200, jobToResponse(job));
      return;
    }

    if (req.method === "POST" && url.pathname === "/audits") {
      if (!allow(clientIp(req))) {
        send(429, { error: "Rate limit exceeded — max 5 audit submissions per 10 minutes per IP." });
        return;
      }
      let size = 0;
      const chunks: Buffer[] = [];
      let aborted = false;
      req.on("data", (c: Buffer) => {
        size += c.length;
        if (size > MAX_BODY_BYTES) {
          aborted = true;
          send(413, { error: "Request body exceeds 512KB." });
          req.destroy();
          return;
        }
        chunks.push(c);
      });
      req.on("end", () => {
        if (aborted) return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          send(400, { error: "Body must be valid JSON." });
          return;
        }
        const result = AuditRequest.safeParse(parsed);
        if (!result.success) {
          const issue = result.error.issues[0];
          const path = issue?.path.join(".") || "body";
          // Surface "source exceeds 100k chars" as 413, everything else as 400.
          if (/exceeds/.test(issue?.message ?? "")) {
            send(413, { error: `${path}: ${issue?.message}` });
            return;
          }
          send(400, { error: `${path}: ${issue?.message ?? "invalid"}${path === "body" ? " (expected {source, contractName?, anchor?})" : ""}` });
          return;
        }
        try {
          const { id } = opts.store.submit({
            source: result.data.source,
            contractName: result.data.contractName ?? "Target",
            anchor: result.data.anchor ?? true,
          });
          send(202, { id });
        } catch (e) {
          if (e instanceof QueueFullError) {
            send(429, { error: e.message });
            return;
          }
          send(500, { error: e instanceof Error ? e.message : String(e) });
        }
      });
      return;
    }

    send(405, { error: `${req.method} not allowed here.` });
  });
}

/** Production wiring — only when run directly (pnpm start / pnpm dev), never on import. */
async function main(): Promise<void> {
  await import("./loadEnv");
  const required = (name: string): string => {
    const v = process.env[name];
    if (!v || /^PLACEH/i.test(v)) throw new Error(`${name} is missing or a placeholder in .env`);
    return v;
  };
  const attestationAddress = required("ATTESTATION_ADDR") as `0x${string}`;
  const agentId = required("AGENT_ID");
  const chainId = Number(process.env.MANTLE_CHAIN_ID ?? MANTLE_SEPOLIA_ID);
  if (chainId !== MANTLE_SEPOLIA_ID && chainId !== MANTLE_MAINNET_ID) {
    throw new Error(`MANTLE_CHAIN_ID=${process.env.MANTLE_CHAIN_ID} is not a Mantle chain (expected ${MANTLE_SEPOLIA_ID} or ${MANTLE_MAINNET_ID})`);
  }
  const token = required("CONATUS_API_TOKEN");
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "https://conatus.rectorspace.com";
  const port = Number(process.env.PORT ?? 8787);
  const slitherBin =
    process.env.SLITHER_BIN ?? fileURLToPath(new URL("../../.venv/bin/slither", import.meta.url));
  const rawJwt = process.env.IPFS_PINNING_JWT;
  const ipfsJwt = !rawJwt || /^PLACEH/i.test(rawJwt) ? "" : rawJwt;

  const runner: StageRunner = {
    audit: (source, contractName) => runAudit(source, { contractName, slitherBin }),
    synthesize: (report, source) => synthesizeAudit(report, source),
    anchorReport: async (report) => {
      const r = await anchorAttestation(report, { attestationAddress, agentId: BigInt(agentId), chainId, ipfsJwt });
      return { txHash: r.txHash, explorerUrl: r.explorerUrl, findingsURI: r.findingsURI, ipfsBackend: r.ipfsBackend };
    },
  };

  const server = createServer({
    store: createJobStore({ runner }),
    token,
    allowedOrigin,
    agentId,
    chainId,
    rateLimit: { capacity: 5, refillPerMs: 5 / (10 * 60 * 1000) },
  });
  server.listen(port, "0.0.0.0", () => {
    console.log(`conatus agent service listening on :${port} (agentId ${agentId}, chainId ${chainId})`);
  });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((e) => {
    console.error("Fatal startup error:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
