import { describe, it, expect, afterEach, vi } from "vitest";
import type { Server } from "node:http";
import { createServer } from "../src/server";
import type { StageRunner } from "../src/stageRunner";
import type { AuditReport } from "../src/schema";

const TOKEN = "test-token-0123456789abcdef";

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

async function boot() {
  server = createServer({ runner, token: TOKEN, agentId: "130", chainId: 5003 });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address() as { port: number };
  return `http://127.0.0.1:${addr.port}`;
}

const auth = { "content-type": "application/json", "x-api-token": TOKEN };

describe("agent worker HTTP service", () => {
  it("healthz is open and reports agentId + chainId", async () => {
    const base = await boot();
    const res = await fetch(`${base}/healthz`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; agentId: string; chainId: number };
    expect(body.ok).toBe(true);
    expect(body.agentId).toBe("130");
    expect(body.chainId).toBe(5003);
  });

  it("rejects a missing/bad token on /run-audit with 401", async () => {
    const base = await boot();
    const res = await fetch(`${base}/run-audit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "contract A {}" }),
    });
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toMatch(/token/i);
  });

  it("validates the body with zod (400 + field detail)", async () => {
    const base = await boot();
    const res = await fetch(`${base}/run-audit`, { method: "POST", headers: auth, body: JSON.stringify({ nope: 1 }) });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toMatch(/source/);
  });

  it("rejects oversize source with 413", async () => {
    const base = await boot();
    const res = await fetch(`${base}/run-audit`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ source: "x".repeat(100_001) }),
    });
    expect(res.status).toBe(413);
  });

  it("runs the pipeline synchronously and returns 200 {report, anchor}", async () => {
    const base = await boot();
    const res = await fetch(`${base}/run-audit`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ source: "contract A {}", contractName: "A" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { report: { riskScore: number }; anchor: { txHash: string } };
    expect(body.report.riskScore).toBe(87);
    expect(body.anchor.txHash).toBe("0xt");
  });

  it("skips anchor when anchor=false (no anchor in response)", async () => {
    const base = await boot();
    const res = await fetch(`${base}/run-audit`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ source: "contract A {}", contractName: "A", anchor: false }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { report: unknown; anchor?: unknown };
    expect(body.anchor).toBeUndefined();
  });

  it("unknown path → 404", async () => {
    const base = await boot();
    const res = await fetch(`${base}/audits`, { headers: auth });
    expect(res.status).toBe(404);
  });

  it("wrong method on /run-audit → 405", async () => {
    const base = await boot();
    const res = await fetch(`${base}/run-audit`, { method: "GET", headers: auth });
    expect(res.status).toBe(405);
  });
});
