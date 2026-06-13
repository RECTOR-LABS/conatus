import type { Finding, Severity, Confidence } from "./schema";

/**
 * Documented, reproducible risk-scoring rubric.
 *
 * `riskScore` (0–100, higher = riskier) is derived deterministically from the findings —
 * NOT a free-form LLM number. Anyone can recompute it from the findings list, which is what
 * makes the on-chain verdict credible. The rubric:
 *
 *   riskScore = min(100, round( Σ  SEVERITY_WEIGHT[severity] × CONFIDENCE_MULTIPLIER[confidence] ))
 *
 * Security severities carry weight; `optimization`/`informational` carry ZERO risk weight
 * (they are gas/quality notes, not vulnerabilities, and must not inflate a security score).
 */

/** Risk points for one finding at full confidence, by severity. */
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 60,
  high: 25,
  medium: 10,
  low: 3,
  informational: 0,
  optimization: 0,
};

/** Confidence discounts a finding's contribution. Missing confidence is treated as `high`
 *  (Slither always reports one; the LLM is instructed to as well). */
export const CONFIDENCE_MULTIPLIER: Record<Confidence, number> = {
  high: 1.0,
  medium: 0.75,
  low: 0.5,
};

export function computeRiskScore(findings: Finding[]): number {
  const raw = findings.reduce((acc, f) => {
    const weight = SEVERITY_WEIGHT[f.severity];
    const mult = f.confidence ? CONFIDENCE_MULTIPLIER[f.confidence] : 1.0;
    return acc + weight * mult;
  }, 0);
  return Math.min(100, Math.round(raw));
}

/** Count of findings per severity — for the summary line and the UI badges. */
export function severityBreakdown(findings: Finding[]): Record<Severity, number> {
  const base: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
    optimization: 0,
  };
  for (const f of findings) base[f.severity] += 1;
  return base;
}
