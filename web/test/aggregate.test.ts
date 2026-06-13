import { describe, it, expect } from "vitest";
import { aggregateFeedback } from "@/lib/aggregate";

describe("aggregateFeedback", () => {
  it("averages per dimension, skipping revoked, normalizing decimals", () => {
    const rows = aggregateFeedback({
      values: [90n, 80n, 7000n, 50n],
      valueDecimals: [0, 0, 2, 0],
      tag1s: ["audit:accuracy", "audit:accuracy", "audit:coverage", "audit:coverage"],
      revokedStatuses: [false, false, false, true],
    });
    expect(rows).toEqual([
      { dimension: "audit:accuracy", count: 2, average: 85 },
      { dimension: "audit:coverage", count: 1, average: 70 },
    ]);
  });

  it("returns [] for no feedback", () => {
    expect(aggregateFeedback({ values: [], valueDecimals: [], tag1s: [], revokedStatuses: [] })).toEqual([]);
  });
});
