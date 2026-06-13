import { randomUUID } from "node:crypto";
import type { AuditReport } from "./schema";

export type JobStatus = "queued" | "slither" | "synthesis" | "anchoring" | "done" | "error";

export interface AnchorSummary {
  txHash: `0x${string}`;
  explorerUrl: string;
  findingsURI: string;
  ipfsBackend: "pinata" | "data-uri";
}

/** The three pipeline stages, injected so the HTTP layer is testable offline. */
export interface StageRunner {
  audit(source: string, contractName: string): Promise<AuditReport>;
  synthesize(report: AuditReport, source: string): Promise<AuditReport>;
  anchorReport(report: AuditReport): Promise<AnchorSummary>;
}

export interface JobInput {
  source: string;
  contractName: string;
  anchor: boolean;
}

export interface Job {
  id: string;
  status: JobStatus;
  createdAt: number;
  contractName: string;
  anchor: boolean;
  report?: AuditReport;
  anchorResult?: AnchorSummary;
  error?: string;
}

export interface JobStoreOptions {
  runner: StageRunner;
  /** Max jobs waiting or running before submit() throws. */
  queueCap?: number;
  /** Finished (done/error) jobs are purged this long after creation. */
  ttlMs?: number;
  now?: () => number;
}

export class QueueFullError extends Error {
  constructor(cap: number) {
    super(`Audit queue is full (${cap} jobs) — retry in a few minutes.`);
    this.name = "QueueFullError";
  }
}

/**
 * In-memory, single-flight job store. One audit runs at a time (Slither is CPU-bound on the VPS);
 * the rest wait FIFO. Stage errors are captured verbatim on the job — no silent failures. Jobs are
 * GC'd lazily on submit/get after ttl. MVP limitation (documented): restart loses jobs.
 */
export function createJobStore(opts: JobStoreOptions) {
  const queueCap = opts.queueCap ?? 5;
  const ttlMs = opts.ttlMs ?? 60 * 60 * 1000;
  const now = opts.now ?? Date.now;
  const jobs = new Map<string, Job & { source: string }>();
  let chain: Promise<void> = Promise.resolve();

  function gc(): void {
    const cutoff = now() - ttlMs;
    for (const [id, j] of jobs) {
      if ((j.status === "done" || j.status === "error") && j.createdAt < cutoff) jobs.delete(id);
    }
  }

  function activeCount(): number {
    let n = 0;
    for (const j of jobs.values()) {
      if (j.status !== "done" && j.status !== "error") n += 1;
    }
    return n;
  }

  async function run(job: Job & { source: string }): Promise<void> {
    try {
      job.status = "slither";
      const base = await opts.runner.audit(job.source, job.contractName);
      job.status = "synthesis";
      const synth = await opts.runner.synthesize(base, job.source);
      job.report = synth;
      if (job.anchor) {
        job.status = "anchoring";
        job.anchorResult = await opts.runner.anchorReport(synth);
      }
      job.status = "done";
    } catch (e) {
      job.status = "error";
      job.error = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    submit(input: JobInput): { id: string } {
      gc();
      if (activeCount() >= queueCap) throw new QueueFullError(queueCap);
      const job: Job & { source: string } = {
        id: randomUUID(),
        status: "queued",
        createdAt: now(),
        contractName: input.contractName,
        anchor: input.anchor,
        source: input.source,
      };
      jobs.set(job.id, job);
      chain = chain.then(() => run(job));
      return { id: job.id };
    },
    get(id: string): Job | undefined {
      gc();
      return jobs.get(id);
    },
    size(): number {
      return jobs.size;
    },
  };
}

export type JobStore = ReturnType<typeof createJobStore>;
