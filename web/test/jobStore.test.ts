import { describe, it, expect } from "vitest";
import { makeJobStore } from "@/lib/jobStore";
import type { AuditReport } from "@/lib/types";

function fakeRedis() {
  const m = new Map<string, unknown>();
  return {
    set: async (k: string, v: unknown) => { m.set(k, v); return "OK" as const; },
    get: async (k: string) => (m.has(k) ? m.get(k) : null),
    expire: async () => 1 as const,
  };
}

describe("jobStore", () => {
  it("creates a queued job, transitions stages, and reads the report back", async () => {
    const js = makeJobStore(fakeRedis() as never);
    const { id } = await js.createJob({ contractName: "Vuln", anchor: true });

    const queued = await js.getJob(id);
    expect(queued?.status).toBe("queued");
    expect(queued?.contractName).toBe("Vuln");
    expect(queued?.anchor).toBe(true);

    await js.setStage(id, "slither");
    expect((await js.getJob(id))?.status).toBe("slither");

    const report = { riskScore: 60 } as unknown as AuditReport;
    await js.setStage(id, "done", { report });
    const done = await js.getJob(id);
    expect(done?.status).toBe("done");
    expect(done?.report?.riskScore).toBe(60);
  });

  it("getJob returns null for an unknown id; setStage on it is a no-op", async () => {
    const js = makeJobStore(fakeRedis() as never);
    expect(await js.getJob("missing")).toBeNull();
    await js.setStage("missing", "done");
    expect(await js.getJob("missing")).toBeNull();
  });
});
