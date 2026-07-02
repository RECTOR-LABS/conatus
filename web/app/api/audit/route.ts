import { NextRequest, NextResponse } from "next/server";
import { send } from "@vercel/queue";
import { jobStore } from "@/lib/jobStore";
import { rateLimit } from "@/lib/rateLimit";
import { submitAudit } from "@/lib/auditSubmit";

const ipOf = (r: NextRequest): string => (r.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();

/** Producer: validate + rate-limit + create the Redis job + enqueue to Vercel Queues → 202 {id}. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const raw = await req.json().catch(() => null);
  const store = jobStore();
  const allow = rateLimit();
  const { status, body } = await submitAudit(raw, ipOf(req), {
    allow,
    createJob: (input) => store.createJob(input),
    enqueue: (payload) => send("audits", payload),
  });
  return NextResponse.json(body, { status });
}
