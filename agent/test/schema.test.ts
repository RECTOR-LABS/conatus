import { describe, it, expect } from "vitest";
import { AuditReport, Finding } from "../src/schema";

const validReport = {
  schemaVersion: "1" as const,
  target: { kind: "source" as const, targetHash: "0x" + "ab".repeat(32) },
  riskScore: 42,
  summary: "First-pass triage complete.",
  findings: [],
  toolRuns: {
    slither: { status: "ok" as const, findingCount: 0 },
    mantle_gas_review: { status: "ok" as const },
  },
  incomplete: false,
  createdAt: new Date().toISOString(),
};

describe("AuditReport schema", () => {
  it("accepts a valid report", () => {
    expect(AuditReport.parse(validReport).riskScore).toBe(42);
  });

  it("rejects riskScore > 100", () => {
    expect(() => AuditReport.parse({ ...validReport, riskScore: 101 })).toThrow();
  });

  it("rejects a malformed targetHash", () => {
    expect(() =>
      AuditReport.parse({ ...validReport, target: { kind: "source", targetHash: "0x123" } }),
    ).toThrow();
  });

  it("requires toolRuns", () => {
    const { toolRuns, ...rest } = validReport;
    expect(() => AuditReport.parse(rest)).toThrow();
  });

  it("surfaces tool errors (no silent pass) and the incomplete flag", () => {
    const r = AuditReport.parse({
      ...validReport,
      incomplete: true,
      toolRuns: {
        slither: { status: "error" as const, error: "solc fetch failed" },
        mantle_gas_review: { status: "ok" as const },
      },
    });
    expect(r.incomplete).toBe(true);
    expect(r.toolRuns.slither.status).toBe("error");
  });

  it("accepts a finding carrying an llm adjustedFrom audit trail", () => {
    const f = {
      id: "slither-reentrancy-eth-0",
      title: "Reentrancy in withdraw()",
      severity: "critical" as const,
      confidence: "high" as const,
      source: "slither" as const,
      description: "External call before state update enables a drain.",
      adjustedFrom: { severity: "high" as const, confidence: "medium" as const, by: "llm" as const, rationale: "Exploitable for full vault drain." },
    };
    expect(() => Finding.parse(f)).not.toThrow();
    expect(Finding.parse(f).adjustedFrom?.severity).toBe("high");
  });

  it("still accepts a finding with no adjustedFrom (backward compatible)", () => {
    const f = { id: "x", title: "t", severity: "low" as const, source: "slither" as const, description: "d" };
    expect(() => Finding.parse(f)).not.toThrow();
  });
});
