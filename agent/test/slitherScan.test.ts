import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { runSlither } from "../src/tools/slitherScan";

// Use the repo-local venv Slither (../../.venv/bin/slither relative to agent/test/).
const SLITHER_BIN = fileURLToPath(new URL("../../.venv/bin/slither", import.meta.url));

const VULN = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Vuln {
    mapping(address => uint256) public balances;
    function deposit() external payable { balances[msg.sender] += msg.value; }
    function withdraw() external {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "no balance");
        (bool ok, ) = msg.sender.call{value: bal}("");
        require(ok, "send failed");
        balances[msg.sender] = 0; // state written AFTER external call -> reentrancy
    }
}
`;

const BROKEN = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Broken { function f() public { uint256 x = ; } }
`;

describe("runSlither (integration — real Slither via forge)", () => {
  it("flags reentrancy in a vulnerable contract, normalized to our schema", async () => {
    const res = await runSlither(VULN, { contractName: "Vuln", slitherBin: SLITHER_BIN });
    expect(res.status).toBe("ok");
    const reentrancy = res.findings.find((f) => f.check?.includes("reentrancy"));
    expect(reentrancy, `findings: ${res.findings.map((f) => f.check).join(", ")}`).toBeDefined();
    expect(["critical", "high", "medium"]).toContain(reentrancy!.severity);
    expect(reentrancy!.source).toBe("slither");
    expect(reentrancy!.location?.startLine).toBeGreaterThan(0);
  }, 180_000);

  it("returns a structured error (never a fabricated pass) on uncompilable source", async () => {
    const res = await runSlither(BROKEN, { contractName: "Broken", slitherBin: SLITHER_BIN });
    expect(res.status).toBe("error");
    expect(res.findings).toHaveLength(0);
    expect(res.error).toBeTruthy();
  }, 180_000);
});
