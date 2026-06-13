import { keccak256, toBytes } from "viem";
import type { AuditReport, Finding } from "../schema";
import { computeRiskScore, severityBreakdown } from "../scoring";
import { runSlither } from "../tools/slitherScan";
import { runMantleGasReview } from "../tools/mantleGasReview";

export interface RunAuditOptions {
  contractName?: string;
  slitherBin?: string;
  /** Injectable clock for deterministic tests. */
  now?: () => Date;
}

/**
 * Canonical content hash of the audited source — the on-chain key in AuditAttestation.
 * Canonicalization (CRLF→LF, strip trailing whitespace, trim) makes the hash stable across
 * trivial formatting differences so the same logical contract maps to the same attestation.
 */
export function computeTargetHash(source: string): `0x${string}` {
  const canonical = source.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trim();
  return keccak256(toBytes(canonical));
}

/**
 * Deterministic audit pipeline: run the static-analysis + Mantle-gas tools (in parallel),
 * merge their findings, and compute a reproducible verdict. No LLM here — Plan 4 layers
 * synthesis on top. The cardinal rule (CORE.md): a tool failure is surfaced as `incomplete`
 * with an explicit summary — never a fabricated clean pass.
 */
export async function runAudit(source: string, opts: RunAuditOptions = {}): Promise<AuditReport> {
  const contractName = opts.contractName ?? "Target";
  const now = opts.now ?? (() => new Date());

  const [slither, gas] = await Promise.all([
    runSlither(source, { contractName, slitherBin: opts.slitherBin }),
    Promise.resolve(runMantleGasReview(source, contractName)),
  ]);

  const findings: Finding[] = [...slither.findings, ...gas.findings];
  const incomplete = slither.status === "error" || gas.status === "error";
  const riskScore = computeRiskScore(findings);

  return {
    schemaVersion: "1",
    target: { kind: "source", targetHash: computeTargetHash(source), contractName },
    riskScore,
    summary: buildSummary(contractName, findings, riskScore, incomplete, slither.error, gas.error),
    findings,
    toolRuns: {
      slither: {
        status: slither.status,
        ...(slither.error ? { error: slither.error } : {}),
        findingCount: slither.findings.length,
      },
      mantle_gas_review: {
        status: gas.status,
        ...(gas.error ? { error: gas.error } : {}),
        findingCount: gas.findings.length,
        notes: gas.notes,
      },
    },
    incomplete,
    createdAt: now().toISOString(),
  };
}

function buildSummary(
  contractName: string,
  findings: Finding[],
  riskScore: number,
  incomplete: boolean,
  slitherError?: string,
  gasError?: string,
): string {
  if (incomplete) {
    const failed: string[] = [];
    if (slitherError) failed.push(`static analysis failed (${slitherError})`);
    if (gasError) failed.push(`gas review failed (${gasError})`);
    return (
      `INCOMPLETE AUDIT of ${contractName}: ${failed.join("; ")}. ` +
      `The findings below are partial — absence of issues here must NOT be read as a pass.`
    );
  }
  const b = severityBreakdown(findings);
  const sec = b.critical + b.high + b.medium + b.low;
  return (
    `First-pass triage of ${contractName} (riskScore ${riskScore}/100): ` +
    `${b.critical} critical, ${b.high} high, ${b.medium} medium, ${b.low} low security finding(s), ` +
    `plus ${b.optimization} Mantle gas/DA optimization(s). ` +
    (sec === 0
      ? "No security issues surfaced by static analysis — still not a substitute for a full human/formal audit."
      : "Review the ranked findings below; this is first-pass triage, not a formal audit.")
  );
}
