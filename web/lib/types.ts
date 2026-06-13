// Mirrors agent/src/schema.ts + agent/src/jobs.ts response shapes.
// TECH DEBT (documented): hand-copied — the agent package is the source of truth.

export type Severity = "critical" | "high" | "medium" | "low" | "informational" | "optimization";
export type FindingSource = "slither" | "mantle_gas_review" | "llm";
export type Confidence = "high" | "medium" | "low";

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  confidence?: Confidence;
  source: FindingSource;
  check?: string;
  location?: { file?: string; startLine?: number; endLine?: number; snippet?: string };
  description: string;
  recommendation?: string;
  adjustedFrom?: { severity: Severity; confidence?: Confidence; by: "llm"; rationale: string };
}

export interface ToolRun {
  status: "ok" | "skipped" | "error";
  error?: string;
  findingCount?: number;
  notes?: string;
}

export interface AuditReport {
  schemaVersion: "1";
  target: { kind: "source" | "address"; targetHash: string; contractName?: string };
  riskScore: number;
  summary: string;
  findings: Finding[];
  toolRuns: { slither: ToolRun; mantle_gas_review: ToolRun };
  model?: string;
  incomplete: boolean;
  createdAt: string;
}

export type JobStatus = "queued" | "slither" | "synthesis" | "anchoring" | "done" | "error";

export interface AnchorResult {
  txHash: string;
  explorerUrl: string;
  findingsURI: string;
  ipfsBackend: "pinata" | "data-uri";
}

export interface AuditJobResponse {
  id: string;
  status: JobStatus;
  contractName?: string;
  anchor?: boolean;
  createdAt?: number;
  report?: AuditReport;
  anchorResult?: AnchorResult;
  error?: string;
}
