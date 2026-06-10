import { describe, it, expect, afterEach, vi } from "vitest";
import type { Server } from "node:http";
import { createServer } from "../src/server";
import { createJobStore, type StageRunner } from "../src/jobs";
import type { AuditReport } from "../src/schema";

const TOKEN = "test-token-0123456789abcdef";
const ORIGIN = "https://conatus.rectorspace.com";

const fakeReport = (): AuditReport => ({
  schemaVersion: "1",
  target: { kind: "source", targetHash: ("0x" + "ab".repeat(32)) as `0x${string}` },
  riskScore: 87,
  summary: "ok",
  findings: [],
  toolRuns: { slither: { status: "ok" }, mantle_gas_review: { status: "ok" } },
  incomplete: false,
  createdAt: "2026-06-10T00:00:00.000Z",
  model: "m",
});

const runner: StageRunner = {
  audit: vi.fn(async () => fakeReport()),
  synthesize: vi.fn(async (r) => r),
  anchorReport: vi.fn(async () => ({
    txHash: "0xt" as `0x${string}`,
    explorerUrl: "https://sepolia.mantlescan.xyz/tx/0xt",
    findingsURI: "data:application/json;base64,e30=",
    ipfsBackend: "data-uri" as const,
  })),
};

let server: Server;
afterEach(() => new Promise<void>((r) => server?.close(() => r())));

async function boot(rate?: { capacity: number; refillPerMs: number }) {
  server = createServer({
    store: createJobStore({ runner }),
    token: TOKEN,
    allowedOrigin: ORIGIN,
    agentId: "130",
    rateLimit: rate,
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address() as { port: number };
  return `http://127.0.0.1:${addr.port}`;
}

const auth = { "content-type": "application/json", "x-api-token": TOKEN };

describe("agent HTTP service", () => {
  it("healthz is open and reports agentId", async () => {
    const base = await boot();
    const res = await fetch(`${base}/healthz`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; agentId: string };
    expect(body.ok).toBe(true);
    expect(body.agentId).toBe("130");
  });

  it("rejects a missing/bad token with 401", async () => {
    const base = await boot();
    const res = await fetch(`${base}/audits`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "contract A {}" }),
    });
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toMatch(/token/i);
  });

  it("validates the body with zod (400 + field detail)", async () => {
    const base = await boot();
    const res = await fetch(`${base}/audits`, { method: "POST", headers: auth, body: JSON.stringify({ nope: 1 }) });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toMatch(/source/);
  });

  it("rejects oversize source with 413", async () => {
    const base = await boot();
    const res = await fetch(`${base}/audits`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ source: "x".repeat(100_001) }),
    });
    expect(res.status).toBe(413);
  });

  it("accepts a job (202) and polls it to done with report + anchorResult", async () => {
    const base = await boot();
    const post = await fetch(`${base}/audits`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ source: "contract A {}", contractName: "A" }),
    });
    expect(post.status).toBe(202);
    const { id } = (await post.json()) as { id: string };
    await vi.waitFor(async () => {
      const res = await fetch(`${base}/audits/${id}`, { headers: auth });
      const body = (await res.json()) as {
        status: string;
        report: { riskScore: number };
        anchorResult: { txHash: string };
        source?: unknown;
      };
      expect(body.status).toBe("done");
      expect(body.report.riskScore).toBe(87);
      expect(body.anchorResult.txHash).toBe("0xt");
      expect(body.source).toBeUndefined(); // source never echoes back
    });
  });

  it("unknown job id → 404", async () => {
    const base = await boot();
    const res = await fetch(`${base}/audits/00000000-0000-0000-0000-000000000000`, { headers: auth });
    expect(res.status).toBe(404);
  });

  it("rate-limits POSTs per IP with 429", async () => {
    const base = await boot({ capacity: 2, refillPerMs: 0 });
    const body = JSON.stringify({ source: "contract A {}" });
    await fetch(`${base}/audits`, { method: "POST", headers: auth, body });
    await fetch(`${base}/audits`, { method: "POST", headers: auth, body });
    const third = await fetch(`${base}/audits`, { method: "POST", headers: auth, body });
    expect(third.status).toBe(429);
  });

  it("OPTIONS preflight returns the pinned origin", async () => {
    const base = await boot();
    const res = await fetch(`${base}/audits`, { method: "OPTIONS" });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(ORIGIN);
  });
});
