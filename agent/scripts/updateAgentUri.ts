import "../src/loadEnv";
import { createWalletClient, http, publicActions } from "viem";
import { mantleSepolia, MANTLE_SEPOLIA_ID, explorerTxUrl } from "../src/chain";
import { identityRegistryAbi } from "../src/abis";
import { accountFromEnv } from "../src/wallet";

const IDENTITY = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;
const AGENT_ID = 130n;
const ENDPOINTS = {
  web: "https://conatus.rectorspace.com",
  api: "https://conatus-api.rectorspace.com",
};

/** One-shot: enrich agentId 130's registration JSON with the live endpoints.
 *  Default is a DRY RUN (prints before/after). Pass --yes to broadcast setAgentURI. */
async function main(): Promise<void> {
  const account = accountFromEnv();
  const client = createWalletClient({ account, chain: mantleSepolia, transport: http() }).extend(publicActions);

  const current = await client.readContract({
    address: IDENTITY,
    abi: identityRegistryAbi,
    functionName: "tokenURI",
    args: [AGENT_ID],
  });
  const b64 = current.split(",")[1];
  if (!current.startsWith("data:application/json;base64,") || !b64) {
    throw new Error(`tokenURI is not the expected inline data: URI — refusing to overwrite. Current: ${current.slice(0, 80)}…`);
  }
  const registration = JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as Record<string, unknown>;
  console.log("CURRENT registration:", JSON.stringify(registration, null, 2));

  const updated = { ...registration, endpoints: ENDPOINTS };
  const newUri = `data:application/json;base64,${Buffer.from(JSON.stringify(updated), "utf8").toString("base64")}`;
  console.log("UPDATED registration:", JSON.stringify(updated, null, 2));

  if (!process.argv.includes("--yes")) {
    console.log("\nDRY RUN — rerun with --yes to broadcast setAgentURI.");
    return;
  }
  const { request } = await client.simulateContract({
    address: IDENTITY,
    abi: identityRegistryAbi,
    functionName: "setAgentURI",
    args: [AGENT_ID, newUri],
    account,
  });
  const txHash = await client.writeContract(request);
  await client.waitForTransactionReceipt({ hash: txHash });
  console.log(`✓ setAgentURI broadcast: ${explorerTxUrl(MANTLE_SEPOLIA_ID, txHash)}`);
}

main().catch((e) => {
  console.error("updateAgentUri failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
