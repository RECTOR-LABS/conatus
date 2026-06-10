import { describe, it, expect } from "vitest";
import { publicClientFor, MANTLE_SEPOLIA_ID, explorerAddressUrl } from "../src/chain";
import { auditAttestationAbi } from "../src/abis";

const ATTESTATION = "0x94f22E008d0a8825850491170d97ba487Ed9E040" as const;
const DEPLOYER = "0x6BB456d26AB74892d02AA0178403A9d54b5f631F";

describe("chain — live Mantle Sepolia reads of our deployed AuditAttestation", () => {
  const client = publicClientFor(MANTLE_SEPOLIA_ID);

  it("reads attester() and it is our agent wallet", async () => {
    const attester = await client.readContract({
      address: ATTESTATION,
      abi: auditAttestationAbi,
      functionName: "attester",
    });
    expect(attester.toLowerCase()).toBe(DEPLOYER.toLowerCase());
  }, 30_000);

  it("getAttestation returns zero-state for an unknown targetHash", async () => {
    const [riskScore, uri, agentId, ts] = await client.readContract({
      address: ATTESTATION,
      abi: auditAttestationAbi,
      functionName: "getAttestation",
      args: [`0x${"00".repeat(31)}01`],
    });
    expect(riskScore).toBe(0);
    expect(uri).toBe("");
    expect(agentId).toBe(0n);
    expect(ts).toBe(0n);
  }, 30_000);

  it("builds explorer URLs", () => {
    expect(explorerAddressUrl(MANTLE_SEPOLIA_ID, ATTESTATION)).toBe(
      `https://sepolia.mantlescan.xyz/address/${ATTESTATION}`,
    );
  });
});
