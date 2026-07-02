const MAX_SOURCE = 100_000;
const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

export interface SubmitDeps {
  allow(ip: string): Promise<boolean>;
  createJob(input: { contractName: string; anchor: boolean }): Promise<{ id: string }>;
  enqueue(payload: { id: string; source: string; contractName: string; anchor: boolean }): Promise<unknown>;
}
export interface SubmitResult {
  status: number;
  body: unknown;
}

/**
 * Pure audit-submission logic (the producer's brain), injectable for tests:
 * rate-limit → validate → create job in Redis → enqueue to Vercel Queues → 202 {id}.
 * The worker re-validates with zod; this is the fast early gate before we spend a queue message.
 */
export async function submitAudit(raw: unknown, ip: string, deps: SubmitDeps): Promise<SubmitResult> {
  if (!(await deps.allow(ip))) return { status: 429, body: { error: "Rate limit: 5 audits per 10 minutes." } };

  const body = (raw ?? {}) as { source?: unknown; contractName?: unknown; anchor?: unknown };
  if (typeof body.source !== "string" || body.source.length < 1) {
    return { status: 400, body: { error: "source is required (non-empty string)." } };
  }
  if (body.source.length > MAX_SOURCE) {
    return { status: 413, body: { error: "source exceeds 100k chars." } };
  }
  if (body.contractName !== undefined && (typeof body.contractName !== "string" || !NAME_RE.test(body.contractName))) {
    return { status: 400, body: { error: "contractName must be a valid identifier." } };
  }
  if (body.anchor !== undefined && typeof body.anchor !== "boolean") {
    return { status: 400, body: { error: "anchor must be a boolean." } };
  }

  const contractName = typeof body.contractName === "string" ? body.contractName : "Target";
  const anchor = typeof body.anchor === "boolean" ? body.anchor : true;
  const { id } = await deps.createJob({ contractName, anchor });
  await deps.enqueue({ id, source: body.source, contractName, anchor });
  return { status: 202, body: { id } };
}
