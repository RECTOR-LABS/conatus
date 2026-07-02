import type { AuditReport, AnchorResult, JobStatus } from "@/lib/types";
import type { Job } from "@/lib/jobStore";

export interface AuditMessage {
  id: string;
  source: string;
  contractName: string;
  anchor: boolean;
}
export interface WorkerResult {
  report: AuditReport;
  anchor?: AnchorResult;
}
export interface ConsumerDeps {
  setStage(id: string, status: JobStatus, patch?: Partial<Job>): Promise<void>;
  /** Call the container worker's POST /run-audit. `ok=false` → the job is failed and the message retried. */
  runAudit(payload: { source: string; contractName: string; anchor: boolean }): Promise<{ ok: boolean; status: number; result?: WorkerResult }>;
}

/**
 * Queue consumer logic (pure, injectable). Marks the job running, calls the worker
 * synchronously, then records done/error. Throwing on worker failure lets Vercel
 * Queues retry the message.
 *
 * NOTE: the synchronous worker returns only the final report, so intermediate
 * stages (synthesis, anchoring) aren't observable here — progress coarsens to
 * running→done. A future enhancement can pass the job id to the worker and let it
 * write per-stage progress to Redis directly.
 */
export async function runConsumer(message: AuditMessage, deps: ConsumerDeps): Promise<void> {
  await deps.setStage(message.id, "slither");
  const res = await deps.runAudit({ source: message.source, contractName: message.contractName, anchor: message.anchor });
  if (!res.ok || !res.result) {
    await deps.setStage(message.id, "error", { error: `worker returned ${res.status}` });
    throw new Error(`worker returned ${res.status}`);
  }
  await deps.setStage(message.id, "done", { report: res.result.report, anchorResult: res.result.anchor });
}
