import { z } from "zod";

/**
 * The normalized audit data model — the single contract shared across:
 *   tools (slither_scan, mantle_gas_review) → LLM synthesis → on-chain attestation → UI.
 *
 * `riskScore` is 0–100 to mirror both the AuditAttestation contract and the ERC-8004
 * 0–100 score convention, and is computed by a documented, reproducible rubric
 * (see ./scoring.ts) — never a free-form LLM guess.
 */

/** Severity, ordered most→least serious. `optimization` = gas/DA, not a vulnerability. */
export const Severity = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "informational",
  "optimization",
]);
export type Severity = z.infer<typeof Severity>;

/** Which producer surfaced a finding. Deterministic tools vs. the LLM synthesis layer. */
export const FindingSource = z.enum(["slither", "mantle_gas_review", "llm"]);
export type FindingSource = z.infer<typeof FindingSource>;

export const Confidence = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof Confidence>;

/** A source range a finding is cited to. Citations are mandatory for credibility. */
export const SourceLocation = z.object({
  file: z.string().optional(),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
  snippet: z.string().optional(),
});
export type SourceLocation = z.infer<typeof SourceLocation>;

export const Finding = z.object({
  /** Stable, human-readable id, e.g. "slither-reentrancy-eth-1" or "gas-storage-write-2". */
  id: z.string().min(1),
  title: z.string().min(1),
  severity: Severity,
  confidence: Confidence.optional(),
  source: FindingSource,
  /** Tool-native check id where applicable (e.g. a Slither detector key). */
  check: z.string().optional(),
  location: SourceLocation.optional(),
  /** Why this is a finding — must reference the cited code, never hand-wave. */
  description: z.string().min(1),
  /** Concrete suggested fix. */
  recommendation: z.string().optional(),
  /** When LLM synthesis changed this finding's severity, the original tool call is preserved here
   *  for auditability (Policy A: every AI adjustment stays verifiable). */
  adjustedFrom: z
    .object({
      severity: Severity,
      confidence: Confidence.optional(),
      by: z.literal("llm"),
      rationale: z.string().min(1),
    })
    .optional(),
});
export type Finding = z.infer<typeof Finding>;

/** Per-tool execution status. `error` MUST surface — the agent never fabricates a pass on tool failure. */
export const ToolRunStatus = z.enum(["ok", "skipped", "error"]);
export type ToolRunStatus = z.infer<typeof ToolRunStatus>;

export const ToolRun = z.object({
  status: ToolRunStatus,
  error: z.string().optional(),
  findingCount: z.number().int().nonnegative().optional(),
  /** Free-form notes the tool wants the synthesis layer / report to carry (e.g. gas notes). */
  notes: z.string().optional(),
});
export type ToolRun = z.infer<typeof ToolRun>;

export const AuditTarget = z.object({
  kind: z.enum(["source", "address"]),
  /** keccak256 of the canonical audited source (or the deployed address) — the on-chain key. */
  targetHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "targetHash must be a 0x-prefixed 32-byte hex"),
  contractName: z.string().optional(),
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  chainId: z.number().int().positive().optional(),
});
export type AuditTarget = z.infer<typeof AuditTarget>;

export const AuditReport = z.object({
  schemaVersion: z.literal("1"),
  target: AuditTarget,
  /** 0–100, computed by the documented rubric in ./scoring.ts. */
  riskScore: z.number().int().min(0).max(100),
  /** One-paragraph, honest summary. Must state when a tool failed (no silent pass). */
  summary: z.string().min(1),
  findings: z.array(Finding),
  toolRuns: z.object({
    slither: ToolRun,
    mantle_gas_review: ToolRun,
  }),
  /** LLM model used for synthesis, e.g. "anthropic/claude-sonnet-5" (via OpenRouter). */
  model: z.string().optional(),
  /** True when any required tool errored — consumers must treat the verdict as incomplete. */
  incomplete: z.boolean(),
  createdAt: z.string().datetime(),
});
export type AuditReport = z.infer<typeof AuditReport>;
