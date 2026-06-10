import { describe, it, expect } from "vitest";
import type OpenAI from "openai";
import { AuditReport, type Finding } from "../src/schema";
import { applyTriage, synthesizeAudit, type SynthesisOutput } from "../src/synthesis";
import { computeRiskScore } from "../src/scoring";

const baseFindings = (): Finding[] => [
  { id: "slither-reentrancy-eth-0", title: "Reentrancy in withdraw()", severity: "high", confidence: "medium", source: "slither", check: "reentrancy-eth", location: { startLine: 18, endLine: 24 }, description: "External call before state update." },
  { id: "slither-reentrancy-events-1", title: "Reentrancy (events)", severity: "low", confidence: "medium", source: "slither", check: "reentrancy-events", location: { startLine: 18, endLine: 24 }, description: "Events emitted after external call." },
  { id: "slither-solc-version-2", title: "Floating pragma", severity: "informational", source: "slither", check: "solc-version", location: { startLine: 1 }, description: "Pragma allows multiple compiler versions." },
  { id: "gas-storage-0", title: "Repeated storage read", severity: "optimization", confidence: "medium", source: "mantle_gas_review", check: "dynamic-storage", location: { startLine: 18 }, description: "Cache balances[msg.sender] in memory." },
];

describe("applyTriage", () => {
  it("escalates + dedups + adds, moving 21 -> 85 and recording adjustedFrom", () => {
    const out: SynthesisOutput = {
      summary: "Drainable reentrancy; setOwner() unprotected.",
      operations: [
        { action: "reclassify", id: "slither-reentrancy-eth-0", severity: "critical", confidence: "high", location: { startLine: 20, endLine: 23 }, rationale: "External call L20 before state write L23 — vault drain." },
        { action: "dedup", id: "slither-reentrancy-events-1", into: "slither-reentrancy-eth-0", rationale: "Same reentrancy root cause." },
        { action: "add", title: "Missing access control on setOwner()", severity: "high", confidence: "high", description: "Anyone can call setOwner().", recommendation: "Add onlyOwner.", location: { startLine: 30, endLine: 32 }, rationale: "No modifier guards owner assignment." },
      ],
    };
    expect(computeRiskScore(baseFindings())).toBe(21);
    const { findings, skipped } = applyTriage(baseFindings(), out);
    expect(skipped).toBe(0);
    expect(computeRiskScore(findings)).toBe(85);
    const reent = findings.find((f) => f.id === "slither-reentrancy-eth-0")!;
    expect(reent.severity).toBe("critical");
    expect(reent.adjustedFrom).toMatchObject({ severity: "high", by: "llm" });
    expect(findings.some((f) => f.id === "slither-reentrancy-events-1")).toBe(false);
    const added = findings.find((f) => f.source === "llm")!;
    expect(added.id).toMatch(/^llm-/);
    expect(added.location?.startLine).toBe(30);
  });

  it("refuses a dedup that would hide a higher severity inside a lower one", () => {
    const { findings, skipped } = applyTriage(baseFindings(), {
      summary: "x",
      operations: [{ action: "dedup", id: "slither-reentrancy-eth-0", into: "slither-reentrancy-events-1", rationale: "r" }],
    });
    expect(skipped).toBe(1);
    expect(findings.some((f) => f.id === "slither-reentrancy-eth-0")).toBe(true);
  });

  it("drops add/reclassify ops that fail to cite a line range", () => {
    const { findings, skipped } = applyTriage(baseFindings(), {
      summary: "x",
      operations: [
        { action: "add", title: "Uncited", severity: "high", description: "d", rationale: "r" },
        { action: "reclassify", id: "slither-solc-version-2", severity: "high", rationale: "r" },
      ],
    });
    expect(skipped).toBe(2);
    expect(findings).toHaveLength(baseFindings().length);
    expect(findings.find((f) => f.id === "slither-solc-version-2")!.severity).toBe("informational");
  });

  it("ignores ops referencing unknown ids", () => {
    const { skipped } = applyTriage(baseFindings(), {
      summary: "x",
      operations: [{ action: "reclassify", id: "nope-999", severity: "critical", location: { startLine: 1 }, rationale: "r" }],
    });
    expect(skipped).toBe(1);
  });
});

const GOOD_KEY = "sk-or-test-0000000000000000";
const VAULT_SRC = `pragma solidity ^0.8.20;\ncontract Vault { /* withdraw + setOwner */ }`;

const makeReport = (findings: Finding[], overrides: Partial<AuditReport> = {}): AuditReport => ({
  schemaVersion: "1",
  target: { kind: "source", targetHash: ("0x" + "ab".repeat(32)) as `0x${string}` },
  riskScore: computeRiskScore(findings),
  summary: "First-pass triage.",
  findings,
  toolRuns: { slither: { status: "ok" }, mantle_gas_review: { status: "ok", notes: "gas notes" } },
  incomplete: false,
  createdAt: "2026-06-10T00:00:00.000Z",
  ...overrides,
});

// Faithful to the OpenRouter/openai shape: each tool_call carries id + type:"function".
const mockClient = (...responses: (SynthesisOutput | string)[]): OpenAI => {
  let i = 0;
  return {
    chat: {
      completions: {
        create: async () => {
          const r = responses[Math.min(i, responses.length - 1)];
          i++;
          const args = typeof r === "string" ? r : JSON.stringify(r);
          return { choices: [{ message: { tool_calls: [{ id: "call_test", type: "function", function: { name: "submit_triage", arguments: args } }] } }] };
        },
      },
    },
  } as unknown as OpenAI;
};

const HAPPY: SynthesisOutput = {
  summary: "Critical reentrancy in withdraw() is drainable; setOwner() lacks access control.",
  operations: [
    { action: "reclassify", id: "slither-reentrancy-eth-0", severity: "critical", confidence: "high", location: { startLine: 20, endLine: 23 }, rationale: "Call L20 before write L23." },
    { action: "dedup", id: "slither-reentrancy-events-1", into: "slither-reentrancy-eth-0", rationale: "Same root cause." },
    { action: "add", title: "Missing access control on setOwner()", severity: "high", confidence: "high", description: "Anyone can call setOwner().", recommendation: "Add onlyOwner.", location: { startLine: 30, endLine: 32 }, rationale: "No modifier." },
  ],
};

describe("synthesizeAudit", () => {
  it("throws on a placeholder/short key before any call", async () => {
    await expect(synthesizeAudit(makeReport(baseFindings()), VAULT_SRC, { apiKey: "PLACEHOLDER_KEY_VALUE" })).rejects.toThrow(/placeholder/i);
    await expect(synthesizeAudit(makeReport(baseFindings()), VAULT_SRC, { apiKey: "short" })).rejects.toThrow();
  });

  it("applies triage, recomputes the score to 85, and returns a schema-valid report", async () => {
    const r = await synthesizeAudit(makeReport(baseFindings()), VAULT_SRC, { apiKey: GOOD_KEY, model: "anthropic/claude-sonnet-4.6", client: mockClient(HAPPY), now: () => new Date("2026-06-10T00:00:00.000Z") });
    expect(r.riskScore).toBe(85);
    expect(r.riskScore).toBe(computeRiskScore(r.findings));
    expect(r.model).toBe("anthropic/claude-sonnet-4.6");
    expect(r.findings.find((f) => f.id === "slither-reentrancy-eth-0")!.adjustedFrom?.severity).toBe("high");
    expect(() => AuditReport.parse(r)).not.toThrow();
  });

  it("latches incomplete and forces the INCOMPLETE summary prefix", async () => {
    const r = await synthesizeAudit(makeReport(baseFindings(), { incomplete: true }), VAULT_SRC, { apiKey: GOOD_KEY, client: mockClient({ summary: "All clear.", operations: [] }) });
    expect(r.incomplete).toBe(true);
    expect(r.summary).toMatch(/INCOMPLETE/);
  });

  it("retries once on malformed args, then succeeds", async () => {
    const r = await synthesizeAudit(makeReport(baseFindings()), VAULT_SRC, { apiKey: GOOD_KEY, client: mockClient("{not json", HAPPY) });
    expect(r.riskScore).toBe(85);
  });

  it("throws if the model never returns valid output after the retry", async () => {
    await expect(synthesizeAudit(makeReport(baseFindings()), VAULT_SRC, { apiKey: GOOD_KEY, client: mockClient("{bad", "{bad") })).rejects.toThrow(/synthesis failed/i);
  });

  it("wraps a transport error with an actionable message", async () => {
    const throwing = { chat: { completions: { create: async () => { throw new Error("ECONNREFUSED"); } } } } as unknown as OpenAI;
    await expect(synthesizeAudit(makeReport(baseFindings()), VAULT_SRC, { apiKey: GOOD_KEY, client: throwing })).rejects.toThrow(/LLM call failed/i);
  });
});
