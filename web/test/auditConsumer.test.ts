import { describe, it, expect, vi } from "vitest";
import { runConsumer, type ConsumerDeps, type WorkerResult } from "@/lib/auditConsumer";
import type { AuditReport } from "@/lib/types";

const msg = { id: "job-1", source: "contract A {}", contractName: "A", anchor: true };
const result: WorkerResult = {
  report: { riskScore: 87 } as unknown as AuditReport,
  anchor: { txHash: "0xabc" } as never,
};

function deps(over: Partial<ConsumerDeps> = {}): ConsumerDeps {
  return {
    setStage: vi.fn(async () => {}),
    runAudit: vi.fn(async () => ({ ok: true, status: 200, result })),
    ...over,
  };
}

describe("runConsumer", () => {
  it("marks running, calls the worker, then done with report + anchorResult", async () => {
    const d = deps();
    await runConsumer(msg, d);
    expect(d.runAudit).toHaveBeenCalledWith({ source: "contract A {}", contractName: "A", anchor: true });
    expect(d.setStage).toHaveBeenNthCalledWith(1, "job-1", "slither");
    expect(d.setStage).toHaveBeenNthCalledWith(2, "job-1", "done", { report: result.report, anchorResult: result.anchor });
  });

  it("on worker failure: marks error and throws (so Queues retries)", async () => {
    const d = deps({ runAudit: vi.fn(async () => ({ ok: false, status: 502 })) });
    await expect(runConsumer(msg, d)).rejects.toThrow(/502/);
    expect(d.setStage).toHaveBeenNthCalledWith(2, "job-1", "error", { error: "worker returned 502" });
  });
});
