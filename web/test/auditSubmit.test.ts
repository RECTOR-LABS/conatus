import { describe, it, expect, vi } from "vitest";
import { submitAudit, type SubmitDeps } from "@/lib/auditSubmit";

function deps(overrides: Partial<SubmitDeps> = {}): SubmitDeps {
  return {
    allow: vi.fn(async () => true),
    createJob: vi.fn(async () => ({ id: "job-1" })),
    enqueue: vi.fn(async () => ({ messageId: "m1" })),
    ...overrides,
  };
}

describe("submitAudit", () => {
  it("202 + creates job + enqueues on a valid body", async () => {
    const d = deps();
    const r = await submitAudit({ source: "contract A {}", contractName: "A" }, "1.2.3.4", d);
    expect(r.status).toBe(202);
    expect((r.body as { id: string }).id).toBe("job-1");
    expect(d.createJob).toHaveBeenCalledWith({ contractName: "A", anchor: true });
    expect(d.enqueue).toHaveBeenCalledWith({ id: "job-1", source: "contract A {}", contractName: "A", anchor: true });
  });

  it("429 when rate-limited, and never creates a job or enqueues", async () => {
    const d = deps({ allow: vi.fn(async () => false) });
    const r = await submitAudit({ source: "x" }, "ip", d);
    expect(r.status).toBe(429);
    expect(d.createJob).not.toHaveBeenCalled();
    expect(d.enqueue).not.toHaveBeenCalled();
  });

  it("400 when source is missing", async () => {
    const r = await submitAudit({ contractName: "A" }, "ip", deps());
    expect(r.status).toBe(400);
  });

  it("413 when source exceeds 100k chars", async () => {
    const r = await submitAudit({ source: "x".repeat(100_001) }, "ip", deps());
    expect(r.status).toBe(413);
  });

  it("400 on an invalid contractName", async () => {
    const r = await submitAudit({ source: "x", contractName: "1bad name" }, "ip", deps());
    expect(r.status).toBe(400);
  });

  it("defaults contractName=Target and anchor=true", async () => {
    const d = deps();
    await submitAudit({ source: "x" }, "ip", d);
    expect(d.createJob).toHaveBeenCalledWith({ contractName: "Target", anchor: true });
  });
});
