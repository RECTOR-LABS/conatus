import type { Finding, ToolRunStatus } from "../schema";

/**
 * Mantle-aware gas / data-availability heuristics.
 *
 * Mantle (post-Arsia upgrade, Apr 2026) settles data availability to Ethereum blobs — NOT EigenDA.
 * So the two cost drivers are: (1) storage writes, paid in MNT gas, and (2) calldata size, which
 * flows into the L1 blob-DA cost. This deterministic pass flags a few high-signal, low-false-positive
 * patterns and frames them in Mantle's cost model. It is explicitly a FIRST-PASS heuristic over the
 * source text — the LLM synthesis layer refines and prioritizes; it is not a full IR/AST analysis.
 */

export interface GasReviewResult {
  status: ToolRunStatus;
  findings: Finding[];
  /** Mantle cost-posture summary carried into the report. */
  notes: string;
  error?: string;
}

/** Blank out comments while preserving length + newlines, so match indices map to real line numbers. */
function blankComments(src: string): string {
  return src
    .replace(/\/\/[^\n]*/g, (m) => " ".repeat(m.length))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}

function lineOf(src: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < src.length; i++) if (src[i] === "\n") line += 1;
  return line;
}

export function runMantleGasReview(source: string, contractName = "Target"): GasReviewResult {
  try {
    const src = blankComments(source);
    const findings: Finding[] = [];

    // (1) Dynamic-type params taken as `memory` on external/public functions -> prefer `calldata`.
    const fnRe = /function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)([^{;]*)/g;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = fnRe.exec(src))) {
      const fnName = m[1] ?? "fn";
      const params = m[2] ?? "";
      const mods = m[3] ?? "";
      if (!/(external|public)/.test(mods)) continue;
      if (/\b(string|bytes|[A-Za-z0-9_]+\s*\[\s*\])\s+memory\b/.test(params)) {
        findings.push({
          id: `gas-calldata-${i++}`,
          title: `Use \`calldata\` for the dynamic parameter(s) of \`${fnName}\``,
          severity: "optimization",
          confidence: "high",
          source: "mantle_gas_review",
          check: "calldata-over-memory",
          location: { startLine: lineOf(src, m.index) },
          description:
            `\`${fnName}\` accepts a dynamic-type argument as \`memory\`. Marking it \`calldata\` removes the memory copy, and on Mantle the calldata size drives the L1 blob data-availability cost (post-Arsia) — saving both L2 gas and L1 DA.`,
          recommendation: `Change the \`memory\` dynamic parameter(s) of \`${fnName}\` to \`calldata\`.`,
        });
      }
    }

    // (2) `string` / `bytes` storage state variables -> expensive under Mantle's DA-driven model.
    const stateRe = /(?:^|\n)[ \t]*(string|bytes)[ \t]+(?:public[ \t]+|private[ \t]+|internal[ \t]+|constant[ \t]+|immutable[ \t]+)*([A-Za-z0-9_]+)[ \t]*(?:=|;)/g;
    let s: RegExpExecArray | null;
    let j = 0;
    while ((s = stateRe.exec(src))) {
      const ty = s[1] ?? "string";
      const varName = s[2] ?? "v";
      findings.push({
        id: `gas-storage-${j++}`,
        title: `Dynamic storage \`${ty} ${varName}\` is costly on Mantle`,
        severity: "optimization",
        confidence: "medium",
        source: "mantle_gas_review",
        check: "dynamic-storage",
        location: { startLine: lineOf(src, s.index + (s[0].startsWith("\n") ? 1 : 0)) },
        description:
          `\`${ty} ${varName}\` is dynamic storage. On Mantle, storage writes cost MNT gas and large values bloat state. Where the full value need not be on-chain, store a \`bytes32\` content hash and keep the payload off-chain (IPFS) — exactly the pattern Conatus uses for its findings reports.`,
        recommendation: `If \`${varName}\` need not be fully on-chain-readable, replace it with a \`bytes32\` hash + an off-chain URI.`,
      });
    }

    const calldataCount = findings.filter((f) => f.check === "calldata-over-memory").length;
    const storageCount = findings.filter((f) => f.check === "dynamic-storage").length;
    const notes =
      `Mantle cost model (post-Arsia, Apr 2026): L2 execution is cheap; cost is driven by storage writes (MNT gas) ` +
      `and calldata size (settled to Ethereum blob DA). Heuristic scan of ${contractName} surfaced ` +
      `${calldataCount} calldata/DA optimization(s) and ${storageCount} dynamic-storage note(s). First-pass heuristic, not a full IR analysis.`;

    return { status: "ok", findings, notes };
  } catch (e) {
    return { status: "error", findings: [], notes: "", error: e instanceof Error ? e.message : String(e) };
  }
}
