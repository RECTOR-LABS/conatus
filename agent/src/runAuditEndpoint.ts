import type { AuditReport } from "./schema";
import type { AnchorSummary, StageRunner } from "./stageRunner";

export interface RunAuditInput {
  source: string;
  contractName: string;
  anchor: boolean;
}
export interface RunAuditOutput {
  report: AuditReport;
  anchor?: AnchorSummary;
}

/**
 * Synchronous audit pipeline — the container worker's whole job.
 * No queue, no store: the caller (the web/ queue consumer) owns job state.
 * Stages run in order; a stage that throws propagates (the consumer marks the
 * job errored and lets Vercel Queues retry) — no silent failures.
 */
export async function runAuditPipeline(input: RunAuditInput, deps: StageRunner): Promise<RunAuditOutput> {
  const base = await deps.audit(input.source, input.contractName);
  const report = await deps.synthesize(base, input.source);
  if (!input.anchor) return { report };
  const anchor = await deps.anchorReport(report);
  return { report, anchor };
}
