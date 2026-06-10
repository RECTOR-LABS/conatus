import { describe, it, expect } from "vitest";
import { simulateAttest } from "../src/anchor";

const ATTESTATION = "0x94f22E008d0a8825850491170d97ba487Ed9E040" as const;
const ATTESTER = "0x6BB456d26AB74892d02AA0178403A9d54b5f631F" as const; // our agent wallet
const STRANGER = "0x000000000000000000000000000000000000dEaD" as const;
const targetHash = `0x${"ab".repeat(32)}` as `0x${string}`;
const findingsURI = "data:application/json;base64,e30="; // {}

describe("simulateAttest (live Mantle Sepolia, no broadcast)", () => {
  it("succeeds when called by the attester wallet", async () => {
    const { request } = await simulateAttest({
      attestationAddress: ATTESTATION,
      account: ATTESTER,
      targetHash,
      findingsURI,
      riskScore: 42,
      agentId: 130n,
    });
    expect(request.functionName).toBe("attest");
  }, 30_000);

  it("reverts via onlyAttester when called by a non-attester", async () => {
    await expect(
      simulateAttest({
        attestationAddress: ATTESTATION,
        account: STRANGER,
        targetHash,
        findingsURI,
        riskScore: 42,
        agentId: 130n,
      }),
    ).rejects.toThrow();
  }, 30_000);

  it("reverts when riskScore exceeds 100", async () => {
    await expect(
      simulateAttest({
        attestationAddress: ATTESTATION,
        account: ATTESTER,
        targetHash,
        findingsURI,
        riskScore: 101,
        agentId: 130n,
      }),
    ).rejects.toThrow();
  }, 30_000);
});
