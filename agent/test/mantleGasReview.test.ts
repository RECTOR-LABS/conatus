import { describe, it, expect } from "vitest";
import { runMantleGasReview } from "../src/tools/mantleGasReview";

const GAS_HEAVY = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract GasHeavy {
    string public name;
    bytes public data;
    function setMessage(string memory m) external { name = m; }
    function pure2(uint256 x) external pure returns (uint256) { return x; }
}
`;

const LEAN = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Lean {
    uint256 public immutable cap;
    mapping(address => uint256) private bal;
    constructor(uint256 c) { cap = c; }
    function set(uint256 v) external { bal[msg.sender] = v; }
    function get(address a) external view returns (uint256) { return bal[a]; }
}
`;

describe("runMantleGasReview", () => {
  it("flags memory dynamic params on external fns and dynamic storage", () => {
    const res = runMantleGasReview(GAS_HEAVY, "GasHeavy");
    expect(res.status).toBe("ok");

    const calldata = res.findings.filter((f) => f.check === "calldata-over-memory");
    expect(calldata).toHaveLength(1);
    expect(calldata[0]!.title).toContain("setMessage");

    const storage = res.findings.filter((f) => f.check === "dynamic-storage");
    expect(storage).toHaveLength(2); // string name + bytes data

    for (const f of res.findings) {
      expect(f.severity).toBe("optimization");
      expect(f.source).toBe("mantle_gas_review");
      expect(f.location?.startLine).toBeGreaterThan(0);
    }
  });

  it("frames notes in Mantle's post-Arsia blob-DA cost model", () => {
    const res = runMantleGasReview(GAS_HEAVY, "GasHeavy");
    expect(res.notes).toMatch(/Arsia/);
    expect(res.notes).toMatch(/blob/i);
    expect(res.notes).not.toMatch(/EigenDA/i); // strategy delta: EigenDA was removed
  });

  it("returns no findings for a lean contract", () => {
    const res = runMantleGasReview(LEAN, "Lean");
    expect(res.status).toBe("ok");
    expect(res.findings).toHaveLength(0);
  });
});
