import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { runAudit, computeTargetHash } from "../src/audit/runAudit";
import { AuditReport } from "../src/schema";

const SLITHER_BIN = fileURLToPath(new URL("../../.venv/bin/slither", import.meta.url));
const FIXED = () => new Date("2026-06-10T00:00:00.000Z");

const VULN = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Vuln {
    string public note;
    mapping(address => uint256) public balances;
    function deposit() external payable { balances[msg.sender] += msg.value; }
    function setNote(string memory n) external { note = n; }
    function withdraw() external {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "no balance");
        (bool ok, ) = msg.sender.call{value: bal}("");
        require(ok, "send failed");
        balances[msg.sender] = 0;
    }
}
`;

describe("runAudit (integration)", () => {
  it("produces a schema-valid, complete report with merged findings", async () => {
    const r = await runAudit(VULN, { contractName: "Vuln", slitherBin: SLITHER_BIN, now: FIXED });
    expect(() => AuditReport.parse(r)).not.toThrow();
    expect(r.incomplete).toBe(false);
    expect(r.toolRuns.slither.status).toBe("ok");
    expect(r.toolRuns.mantle_gas_review.status).toBe("ok");
    expect(r.target.targetHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(r.riskScore).toBeGreaterThan(0);
    expect(r.findings.some((f) => f.source === "slither")).toBe(true);
    expect(r.findings.some((f) => f.source === "mantle_gas_review")).toBe(true);
    expect(r.createdAt).toBe("2026-06-10T00:00:00.000Z");
  }, 180_000);

  it("marks the report incomplete (no fabricated pass) when static analysis fails", async () => {
    const broken = "pragma solidity ^0.8.20; contract B { function f() public { uint x = ; } }";
    const r = await runAudit(broken, { contractName: "B", slitherBin: SLITHER_BIN, now: FIXED });
    expect(r.incomplete).toBe(true);
    expect(r.toolRuns.slither.status).toBe("error");
    expect(r.summary).toMatch(/INCOMPLETE/);
  }, 180_000);
});

describe("computeTargetHash", () => {
  it("is deterministic and whitespace-canonical", () => {
    expect(computeTargetHash("contract A {}\n")).toBe(computeTargetHash("contract A {}   \r\n"));
    expect(computeTargetHash("contract A {}")).toMatch(/^0x[0-9a-f]{64}$/);
  });
  it("differs for different source", () => {
    expect(computeTargetHash("contract A {}")).not.toBe(computeTargetHash("contract B {}"));
  });
});
