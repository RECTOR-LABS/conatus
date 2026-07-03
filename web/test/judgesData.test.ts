import { describe, it, expect } from "vitest";
import {
  FOOTNOTES,
  footnoteIndex,
  MAINNET,
  REPUTATION,
  RATED_TARGET,
  EIP_SELF_FEEDBACK_QUOTE,
  SYBIL_DEMO,
} from "@/app/judges/_data";

describe("judges _data", () => {
  it("every footnote has a unique id, valid https href, and known type", () => {
    const ids = new Set<string>();
    for (const f of FOOTNOTES) {
      expect(f.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(f.id)).toBe(false);
      ids.add(f.id);
      expect(f.href.startsWith("https://")).toBe(true);
      expect(["eip", "source", "chain", "test"]).toContain(f.type);
      expect(f.label.length).toBeGreaterThan(0);
    }
    expect(FOOTNOTES.length).toBeGreaterThanOrEqual(6);
  });

  it("footnoteIndex is 1-based and throws on unknown id", () => {
    expect(footnoteIndex(FOOTNOTES[0].id)).toBe(1);
    expect(() => footnoteIndex("nope-not-real")).toThrow();
  });

  it("exposes the real, verified on-chain constants", () => {
    expect(MAINNET.owner).toBe("0x6BB456d26AB74892d02AA0178403A9d54b5f631F");
    expect(MAINNET.rater).toBe("0x7551A2163B2201fDAFF6C87e0Ace0e73c1FbF135");
    expect(MAINNET.owner).not.toBe(MAINNET.rater); // self-rejection, proven
    expect(MAINNET.agentId).toBe(115);
    expect(REPUTATION.map((r) => r.value)).toEqual([90, 85, 88]);
    // full 32-byte hashes, never truncated; the rated audit and the score-60 Vault are different targets
    expect(RATED_TARGET).toMatch(/^0x[0-9a-f]{64}$/);
    expect(MAINNET.vaultTarget).toMatch(/^0x[0-9a-f]{64}$/);
    expect(MAINNET.verdictTx).toMatch(/^0x[0-9a-f]{64}$/);
    expect(RATED_TARGET).not.toBe(MAINNET.vaultTarget);
  });

  it("quotes the EIP self-feedback rule verbatim", () => {
    expect(EIP_SELF_FEEDBACK_QUOTE).toContain("MUST NOT be the agent owner");
  });

  it("sybil demo has one real rater (with proof) among throwaways (no proof)", () => {
    const real = SYBIL_DEMO.filter((r) => r.proofOfConsumption);
    const fakes = SYBIL_DEMO.filter((r) => !r.proofOfConsumption);
    expect(real).toHaveLength(1);
    expect(real[0].value).toBe(90);
    expect(fakes.length).toBeGreaterThanOrEqual(9);
    expect(fakes.every((r) => r.reputation === 0)).toBe(true);
  });
});
