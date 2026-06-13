import { describe, it, expect } from "vitest";
import { computeRiskScore, severityBreakdown, SEVERITY_WEIGHT } from "../src/scoring";
import type { Finding } from "../src/schema";

const mk = (
  severity: Finding["severity"],
  confidence?: Finding["confidence"],
  id = "x",
): Finding => ({ id, title: "t", severity, confidence, source: "slither", description: "d" });

describe("computeRiskScore", () => {
  it("is 0 with no findings", () => {
    expect(computeRiskScore([])).toBe(0);
  });

  it("ignores optimization + informational (zero security weight)", () => {
    expect(computeRiskScore([mk("optimization"), mk("informational")])).toBe(0);
  });

  it("scores one high-confidence critical at 60", () => {
    expect(computeRiskScore([mk("critical", "high")])).toBe(60);
  });

  it("caps at 100", () => {
    expect(computeRiskScore([mk("critical"), mk("critical"), mk("critical")])).toBe(100);
  });

  it("applies the confidence multiplier (high 25 × 0.75 = 19)", () => {
    expect(computeRiskScore([mk("high", "medium")])).toBe(19);
  });

  it("treats missing confidence as full weight", () => {
    expect(computeRiskScore([mk("medium")])).toBe(SEVERITY_WEIGHT.medium);
  });

  it("sums multiple findings (25 + 10 + 3)", () => {
    expect(computeRiskScore([mk("high"), mk("medium"), mk("low")])).toBe(38);
  });
});

describe("severityBreakdown", () => {
  it("counts per severity", () => {
    const b = severityBreakdown([mk("high"), mk("high"), mk("low")]);
    expect(b.high).toBe(2);
    expect(b.low).toBe(1);
    expect(b.critical).toBe(0);
  });
});
