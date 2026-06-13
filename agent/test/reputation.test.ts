import { describe, it, expect } from "vitest";
import { publicClientFor, MANTLE_SEPOLIA_ID } from "../src/chain";
import { reputationRegistryAbi } from "../src/abis";

const REPUTATION = "0x8004B663056A597Dffe9eCcC1965A193B7388713" as const;
const AGENT_ID = 130n;

describe("reputationRegistryAbi (live Mantle Sepolia reads)", () => {
  it("readAllFeedback decodes with the verified signature (empty clientAddresses = all)", async () => {
    const client = publicClientFor(MANTLE_SEPOLIA_ID);
    const [clients, indexes, values, decimals, tag1s, tag2s, revoked] = await client.readContract({
      address: REPUTATION,
      abi: reputationRegistryAbi,
      functionName: "readAllFeedback",
      args: [AGENT_ID, [], "", "", false],
    });
    // agentId 130 may have zero feedback — decoding without revert is the assertion.
    expect(Array.isArray(clients)).toBe(true);
    expect(clients.length).toBe(values.length);
    expect(indexes.length).toBe(decimals.length);
    expect(tag1s.length).toBe(tag2s.length);
    expect(revoked.length).toBe(clients.length);
  }, 30_000);

  it("getClients returns an address array", async () => {
    const client = publicClientFor(MANTLE_SEPOLIA_ID);
    const clients = await client.readContract({
      address: REPUTATION,
      abi: reputationRegistryAbi,
      functionName: "getClients",
      args: [AGENT_ID],
    });
    expect(Array.isArray(clients)).toBe(true);
  }, 30_000);
});
