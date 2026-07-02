import { describe, it, expect } from "vitest";
import { runAuditPipeline } from "../src/runAuditEndpoint";
import type { StageRunner } from "../src/stageRunner";
import type { AuditReport } from "../src/schema";

const report = (riskScore: number): AuditReport => ({
  schemaVersion: "1",
  target: { kind: "source", targetHash: ("0x" + "ab".repeat(32)) as `0x${string}` },
  riskScore,
  summary: "ok",
  findings: [],
  toolRuns: { slither: { status: "ok" }, mantle_gas_review: { status: "ok" } },
  incomplete: false,
  createdAt: "2026-06-10T00:00:00.000Z",
  model: "m",
});

describe("runAuditPipeline", () => {
  it("runs audit→synthesize and skips anchor when anchor=false", async () => {
    const calls: string[] = [];
    const deps: StageRunner = {
      audit: async () => { calls.push("audit"); return report(0); },
      synthesize: async () => { calls.push("synthesize"); return report(60); },
      anchorReport: async () => { throw new Error("anchor should not be called"); },
    };
    const out = await runAuditPipeline({ source: "x", contractName: "Vuln", anchor: false }, deps);
    expect(out.report.riskScore).toBe(60);
    expect(out.anchor).toBeUndefined();
    expect(calls).toEqual(["audit", "synthesize"]);
  });

  it("anchors when anchor=true and returns the anchor summary", async () => {
    const deps: StageRunner = {
      audit: async () => report(0),
      synthesize: async () => report(87),
      anchorReport: async () => ({
        txHash: "0xabc" as `0x${string}`,
        explorerUrl: "https://mantlescan.xyz/tx/0xabc",
        findingsURI: "data:application/json;base64,e30=",
        ipfsBackend: "data-uri",
      }),
    };
    const out = await runAuditPipeline({ source: "x", contractName: "C", anchor: true }, deps);
    expect(out.report.riskScore).toBe(87);
    expect(out.anchor?.txHash).toBe("0xabc");
  });
});
