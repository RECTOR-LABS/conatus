import http, { type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { pathToFileURL, fileURLToPath } from "node:url";
import { z } from "zod";
import type { StageRunner } from "./stageRunner";
import { runAuditPipeline } from "./runAuditEndpoint";
import { runAudit } from "./audit/runAudit";
import { synthesizeAudit } from "./synthesis";
import { anchorAttestation } from "./anchor";
import { MANTLE_SEPOLIA_ID, MANTLE_MAINNET_ID } from "./chain";

const VERSION = "0.1.0";
const MAX_SOURCE_CHARS = 100_000;
const MAX_BODY_BYTES = 512 * 1024;

const RunAuditRequest = z.object({
  source: z.string().min(1, "source is required").max(MAX_SOURCE_CHARS, "source exceeds 100k chars"),
  contractName: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,63}$/, "contractName must be a valid identifier").optional(),
  anchor: z.boolean().optional(),
});

export interface ServerOptions {
  runner: StageRunner;
  token: string;
  agentId: string;
  chainId: number;
}

function tokenMatches(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Internal audit worker: `POST /run-audit` (synchronous) + `GET /healthz`.
 * Called server-to-server by the web/ queue consumer (x-api-token auth) — no
 * job store, no rate limit, no CORS: those live in the Vercel/web layer now.
 */
export function createServer(opts: ServerOptions): Server {
  return http.createServer((req: IncomingMessage, res: ServerResponse) => {
    const send = (status: number, body: unknown): void => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET" && url.pathname === "/healthz") {
      send(200, { ok: true, version: VERSION, agentId: opts.agentId, chainId: opts.chainId });
      return;
    }

    if (url.pathname !== "/run-audit") {
      send(404, { error: `Unknown path ${url.pathname} — expected /run-audit or /healthz.` });
      return;
    }
    if (req.method !== "POST") {
      send(405, { error: `${req.method} not allowed here.` });
      return;
    }
    if (!tokenMatches(req.headers["x-api-token"] as string | undefined, opts.token)) {
      send(401, { error: "Missing or invalid X-API-Token header." });
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
      const result = RunAuditRequest.safeParse(parsed);
      if (!result.success) {
        const issue = result.error.issues[0];
        const path = issue?.path.join(".") || "body";
        if (/exceeds/.test(issue?.message ?? "")) {
          send(413, { error: `${path}: ${issue?.message}` });
          return;
        }
        send(400, { error: `${path}: ${issue?.message ?? "invalid"}` });
        return;
      }
      runAuditPipeline(
        {
          source: result.data.source,
          contractName: result.data.contractName ?? "Target",
          anchor: result.data.anchor ?? true,
        },
        opts.runner,
      )
        .then((out) => send(200, out))
        .catch((e) => send(500, { error: e instanceof Error ? e.message : String(e) }));
    });
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

  const server = createServer({ runner, token, agentId, chainId });
  server.listen(port, "0.0.0.0", () => {
    console.log(`conatus worker listening on :${port} (agentId ${agentId}, chainId ${chainId})`);
  });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((e) => {
    console.error("Fatal startup error:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
