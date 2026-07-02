import { describe, it, expect, vi } from "vitest";
import { pollAudit } from "@/lib/pollAudit";
import type { Job } from "@/lib/jobStore";

const ID = "11111111-1111-1111-1111-111111111111";
const job = { id: ID, status: "done", createdAt: 1 } as Job;

describe("pollAudit", () => {
  it("400 on an invalid job id (never hits Redis)", async () => {
    const getJob = vi.fn();
    const r = await pollAudit("bad", getJob);
    expect(r.status).toBe(400);
    expect(getJob).not.toHaveBeenCalled();
  });

  it("404 when the job is missing", async () => {
    const r = await pollAudit(ID, async () => null);
    expect(r.status).toBe(404);
  });

  it("200 with the job when found", async () => {
    const r = await pollAudit(ID, async () => job);
    expect(r.status).toBe(200);
    expect(r.body).toEqual(job);
  });
});
