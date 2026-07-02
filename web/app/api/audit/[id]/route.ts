import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/jobStore";
import { pollAudit } from "@/lib/pollAudit";

/** Poll: read the audit job's status/report from Redis (replaces the Railway proxy GET). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  const store = jobStore();
  const { status, body } = await pollAudit(id, (jobId) => store.getJob(jobId));
  return NextResponse.json(body, { status });
}
