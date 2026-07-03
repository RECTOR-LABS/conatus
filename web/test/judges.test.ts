// web/test/judges.test.ts
import { describe, it, expect } from "vitest";
import {
  rubricScore,
  runAudit,
  naiveReputation,
  weightedReputation,
  triageGuard,
  type CalcFinding,
  type Rating,
} from "@/lib/judges";

const critical: CalcFinding = { id: "reentrancy", label: "reentrancy", severity: "critical", confidence: "high" };

describe("rubricScore (mirrors agent/src/scoring.ts)", () => {
  it("is 0 with no findings", () => expect(rubricScore([])).toBe(0));
  it("scores one high-confidence critical at 60", () => expect(rubricScore([critical])).toBe(60));
  it("ignores informational/optimization (zero weight)", () =>
    expect(rubricScore([critical, { id: "x", label: "gas", severity: "optimization" }])).toBe(60));
  it("applies the confidence multiplier (25 × 0.75 = 19)", () =>
    expect(rubricScore([{ id: "h", label: "h", severity: "high", confidence: "medium" }])).toBe(19));
  it("caps at 100", () => expect(rubricScore([critical, critical, critical])).toBe(100));
});

describe("runAudit (Whisker's question: same contract, many runs)", () => {
  it("returns score 60 on every run, 0..9", () => {
    for (let i = 0; i < 10; i++) expect(runAudit(i).score).toBe(60);
  });
  it("finding COUNT wobbles (2 and 3 both occur) while the score stays put", () => {
    const counts = new Set(Array.from({ length: 10 }, (_, i) => runAudit(i).findingCount));
    expect(counts.has(2)).toBe(true);
    expect(counts.has(3)).toBe(true);
  });
  it("always includes the critical reentrancy finding", () => {
    expect(runAudit(4).findings.some((f) => f.severity === "critical")).toBe(true);
  });
});

describe("reputation weighting (sybil defense)", () => {
  const ratings: Rating[] = [
    { rater: "real", value: 90, reputation: 100, proofOfConsumption: true },
    ...Array.from({ length: 10 }, () => ({ rater: "sybil", value: 100, reputation: 0, proofOfConsumption: false })),
  ];
  it("naive average is inflated by the sybil swarm", () => {
    expect(naiveReputation(ratings)).toBeGreaterThan(95);
  });
  it("weighting collapses the swarm to ~0 influence — only the real rater counts", () => {
    expect(weightedReputation(ratings)).toBe(90);
  });
  it("weighted of an empty set is 0 (no divide-by-zero)", () => {
    expect(weightedReputation([])).toBe(0);
  });
});

describe("triageGuard (boxed-in LLM)", () => {
  it("drops an add/reclassify with no citation", () => {
    expect(triageGuard({ action: "add", hasCitation: false })).toBe("dropped");
    expect(triageGuard({ action: "reclassify", hasCitation: false })).toBe("dropped");
  });
  it("accepts a cited add and a dedup", () => {
    expect(triageGuard({ action: "add", hasCitation: true })).toBe("accepted");
    expect(triageGuard({ action: "dedup", hasCitation: false })).toBe("accepted");
  });
});
