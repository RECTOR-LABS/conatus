import { describe, it, expect } from "vitest";
import { EXAMPLES } from "@/lib/examples";
import { MAX_SOURCE_CHARS } from "@/lib/constants";

describe("EXAMPLES", () => {
  it("has three examples with unique ids", () => {
    expect(EXAMPLES).toHaveLength(3);
    expect(new Set(EXAMPLES.map((e) => e.id)).size).toBe(3);
  });

  it("each example is non-empty single-file Solidity within the size cap", () => {
    for (const ex of EXAMPLES) {
      expect(ex.source.trim().length).toBeGreaterThan(0);
      expect(ex.source.length).toBeLessThanOrEqual(MAX_SOURCE_CHARS);
      expect(ex.source).toMatch(/pragma solidity/);
      // single-file only — an import would break Slither in the agent
      expect(ex.source).not.toMatch(/^\s*import\s/m);
    }
  });

  it("each example has a name, descriptor, and valid severity", () => {
    for (const ex of EXAMPLES) {
      expect(ex.name).toBeTruthy();
      expect(ex.descriptor).toBeTruthy();
      expect(["high", "med", "low"]).toContain(ex.severity);
    }
  });
});
