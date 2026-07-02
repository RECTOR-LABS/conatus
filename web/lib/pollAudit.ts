import type { Job } from "@/lib/jobStore";

export interface PollResult {
  status: number;
  body: unknown;
}

/** Pure poll logic (injectable): validate the id, read the job from Redis, 400/404/200. */
export async function pollAudit(id: string, getJob: (id: string) => Promise<Job | null>): Promise<PollResult> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { status: 400, body: { error: "Invalid job id." } };
  const job = await getJob(id);
  if (!job) return { status: 404, body: { error: `No job ${id} — it may have expired (jobs are kept ~1h).` } };
  return { status: 200, body: job };
}
