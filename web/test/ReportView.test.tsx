import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportView } from "@/components/ReportView";
import type { AuditReport } from "@/lib/types";

const report = (over: Partial<AuditReport> = {}): AuditReport => ({
  schemaVersion: "1",
  target: { kind: "source", targetHash: "0x" + "ab".repeat(32), contractName: "Vault" },
  riskScore: 87,
  summary: "Critical reentrancy in withdraw().",
  findings: [
    {
      id: "slither-reentrancy-eth-0",
      title: "Reentrancy in withdraw()",
      severity: "critical",
      source: "slither",
      location: { startLine: 20, endLine: 23 },
      description: "External call before state write.",
      adjustedFrom: { severity: "high", by: "llm", rationale: "Drainable." },
    },
    { id: "llm-setowner-0", title: "Missing access control on setOwner()", severity: "high", source: "llm", location: { startLine: 30 }, description: "Anyone can call setOwner()." },
  ],
  toolRuns: { slither: { status: "ok", findingCount: 1 }, mantle_gas_review: { status: "ok", findingCount: 0 } },
  incomplete: false,
  createdAt: "2026-06-10T00:00:00.000Z",
  model: "anthropic/claude-sonnet-4.6",
  ...over,
});

describe("ReportView", () => {
  it("renders score, summary, findings with citations and the AI re-rated badge", () => {
    render(<ReportView report={report()} anchorResult={{ txHash: "0xabc", explorerUrl: "https://sepolia.mantlescan.xyz/tx/0xabc", findingsURI: "data:application/json;base64,e30=", ipfsBackend: "data-uri" }} />);
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText(/Critical reentrancy/)).toBeInTheDocument();
    expect(screen.getByText(/L20–23/)).toBeInTheDocument();
    expect(screen.getByText(/AI re-rated from high/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view transaction/i })).toHaveAttribute("href", "https://sepolia.mantlescan.xyz/tx/0xabc");
  });

  it("banners INCOMPLETE reports", () => {
    render(<ReportView report={report({ incomplete: true, summary: "INCOMPLETE AUDIT — static analysis failed." })} />);
    expect(screen.getByText(/a required tool failed/i)).toBeInTheDocument();
  });

  it("renders without an anchor block when not anchored", () => {
    render(<ReportView report={report()} />);
    expect(screen.queryByRole("link", { name: /view transaction/i })).not.toBeInTheDocument();
  });
});
