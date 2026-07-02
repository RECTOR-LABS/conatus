import type { AuditReport } from "./schema";

/** Summary of an on-chain attestation returned by the anchor stage. */
export interface AnchorSummary {
  txHash: `0x${string}`;
  explorerUrl: string;
  findingsURI: string;
  ipfsBackend: "pinata" | "data-uri";
}

/**
 * The three pipeline stages, injected so the HTTP layer is testable offline.
 * (Extracted from the old jobs.ts, which the Vercel migration removes — the
 * worker is now stateless; job state lives in the web/ + Redis layer.)
 */
export interface StageRunner {
  audit(source: string, contractName: string): Promise<AuditReport>;
  synthesize(report: AuditReport, source: string): Promise<AuditReport>;
  anchorReport(report: AuditReport): Promise<AnchorSummary>;
}
