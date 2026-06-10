import { describe, it, expect, vi } from "vitest";
import { createJobStore, type StageRunner } from "../src/jobs";
import type { AuditReport } from "../src/schema";

const fakeReport = (riskScore = 21): AuditReport => ({
  schemaVersion: "1",
  target: { kind: "source", targetHash: ("0x" + "ab".repeat(32)) as `0x${string}` },
  riskScore,
  summary: "ok",
  findings: [],
  toolRuns: { slither: { status: "ok" }, mantle_gas_review: { status: "ok" } },
  incomplete: false,
  createdAt: "2026-06-10T00:00:00.000Z",
});

const okRunner = (overrides: Partial<StageRunner> = {}): StageRunner => ({
  audit: vi.fn(async () => fakeReport()),
  synthesize: vi.fn(async (r) => ({ ...r, riskScore: 87, model: "m" })),
  anchorReport: vi.fn(async () => ({
    txHash: "0xt" as `0x${string}`,
    explorerUrl: "https://sepolia.mantlescan.xyz/tx/0xt",
    findingsURI: "data:application/json;base64,e30=",
    ipfsBackend: "data-uri" as const,
  })),
  ...overrides,
});

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("createJobStore", () => {
  it("runs a job through all stages to done with report + anchorResult", async () => {
    const store = createJobStore({ runner: okRunner() });
    const { id } = store.submit({ source: "contract A {}", contractName: "A", anchor: true });
    expect(store.get(id)!.status).toBe("queued");
    await vi.waitFor(() => expect(store.get(id)!.status).toBe("done"));
    const job = store.get(id)!;
    expect(job.report!.riskScore).toBe(87);
    expect(job.anchorResult!.txHash).toBe("0xt");
    expect(job.error).toBeUndefined();
  });

  it("anchor=false skips anchoring (no anchorResult, still done)", async () => {
    const runner = okRunner();
    const store = createJobStore({ runner });
    const { id } = store.submit({ source: "contract A {}", contractName: "A", anchor: false });
    await vi.waitFor(() => expect(store.get(id)!.status).toBe("done"));
    expect(store.get(id)!.anchorResult).toBeUndefined();
    expect(runner.anchorReport).not.toHaveBeenCalled();
  });

  it("a stage error lands in job.error with status error", async () => {
    const store = createJobStore({
      runner: okRunner({ synthesize: vi.fn(async () => { throw new Error("LLM call failed (model=x)"); }) }),
    });
    const { id } = store.submit({ source: "c", contractName: "C", anchor: true });
    await vi.waitFor(() => expect(store.get(id)!.status).toBe("error"));
    expect(store.get(id)!.error).toMatch(/LLM call failed/);
  });

  it("executes single-flight FIFO (second job stays queued until first finishes)", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const store = createJobStore({
      runner: okRunner({ audit: vi.fn(async () => { await gate; return fakeReport(); }) }),
    });
    const a = store.submit({ source: "a", contractName: "A", anchor: false });
    const b = store.submit({ source: "b", contractName: "B", anchor: false });
    await flush();
    expect(store.get(a.id)!.status).toBe("slither");
    expect(store.get(b.id)!.status).toBe("queued");
    release();
    await vi.waitFor(() => expect(store.get(b.id)!.status).toBe("done"));
  });

  it("rejects beyond the queue cap with QueueFullError", () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const store = createJobStore({
      runner: okRunner({ audit: vi.fn(async () => { await gate; return fakeReport(); }) }),
      queueCap: 2,
    });
    store.submit({ source: "1", contractName: "C", anchor: false });
    store.submit({ source: "2", contractName: "C", anchor: false });
    expect(() => store.submit({ source: "3", contractName: "C", anchor: false })).toThrow(/queue is full/i);
    release();
  });

  it("GC purges finished jobs older than ttl on access", async () => {
    let t = 1_000_000;
    const store = createJobStore({ runner: okRunner(), ttlMs: 100, now: () => t });
    const { id } = store.submit({ source: "c", contractName: "C", anchor: false });
    await vi.waitFor(() => expect(store.get(id)!.status).toBe("done"));
    t += 200;
    store.submit({ source: "d", contractName: "D", anchor: false }); // GC hook
    expect(store.get(id)).toBeUndefined();
  });
});
