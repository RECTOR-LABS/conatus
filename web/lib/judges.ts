// web/lib/judges.ts
// Pure, deterministic logic for the /judges page. Mirrors agent/src/scoring.ts and
// agent/src/synthesis.ts guards 1:1 (kept in sync by the tests + footnotes). No React, no I/O.

export type Severity = "critical" | "high" | "medium" | "low" | "informational" | "optimization";
export type Confidence = "high" | "medium" | "low";
export interface CalcFinding { id: string; label: string; severity: Severity; confidence?: Confidence }

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 60, high: 25, medium: 10, low: 3, informational: 0, optimization: 0,
};
export const CONFIDENCE_MULTIPLIER: Record<Confidence, number> = { high: 1.0, medium: 0.75, low: 0.5 };

export function rubricScore(findings: CalcFinding[]): number {
  const raw = findings.reduce((acc, f) => {
    const mult = f.confidence ? CONFIDENCE_MULTIPLIER[f.confidence] : 1.0;
    return acc + SEVERITY_WEIGHT[f.severity] * mult;
  }, 0);
  return Math.min(100, Math.round(raw));
}

export interface AuditRun { runIndex: number; findings: CalcFinding[]; score: number; findingCount: number }

// The demo Vault audit. The critical (60) + a zero-weight gas note are always present;
// a zero-weight informational note appears on some runs — so the COUNT wobbles 2<->3 but the
// SCORE is pinned at 60. This is the visual proof for Whisker's determinism question.
export function runAudit(runIndex: number): AuditRun {
  const findings: CalcFinding[] = [
    { id: "reentrancy", label: "reentrancy in withdraw()", severity: "critical", confidence: "high" },
    { id: "gas", label: "storage write in loop", severity: "optimization" },
  ];
  if (runIndex % 3 === 2) {
    findings.push({ id: "shadow", label: "shadowed local var", severity: "informational" });
  }
  return { runIndex, findings, score: rubricScore(findings), findingCount: findings.length };
}

export interface Rating { rater: string; value: number; reputation: number; proofOfConsumption: boolean }

export function naiveReputation(ratings: Rating[]): number {
  if (ratings.length === 0) return 0;
  return Math.round(ratings.reduce((a, r) => a + r.value, 0) / ratings.length);
}

// A rating's weight = rater reputation, but only if they proved they consumed the audit.
// Fresh throwaway wallets (reputation 0, no proof) contribute nothing.
export function weightedReputation(ratings: Rating[]): number {
  let num = 0, den = 0;
  for (const r of ratings) {
    const w = r.proofOfConsumption ? r.reputation : 0;
    num += r.value * w;
    den += w;
  }
  return den === 0 ? 0 : Math.round(num / den);
}

export type TriageAction = "add" | "reclassify" | "dedup";
export interface TriageOp { action: TriageAction; hasCitation: boolean }

// Mirrors applyTriage: add/reclassify MUST cite a line or they are dropped (and counted). dedup is allowed.
export function triageGuard(op: TriageOp): "accepted" | "dropped" {
  if (op.action === "dedup") return "accepted";
  return op.hasCitation ? "accepted" : "dropped";
}
