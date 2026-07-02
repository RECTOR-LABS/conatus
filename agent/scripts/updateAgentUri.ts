import "../src/loadEnv";
import { createWalletClient, http, publicActions, getAddress } from "viem";
import { mantleMainnet, MANTLE_MAINNET_ID, explorerTxUrl } from "../src/chain";
import { identityRegistryAbi } from "../src/abis";
import { accountFromEnv } from "../src/wallet";

// Update Conatus agent #115's ERC-8004 registration on Mantle mainnet so its advertised
// endpoints.api points at the live same-origin Vercel API. Surgical: only endpoints.api
// changes; every other registration field is preserved verbatim. Owner-gated (setAgentURI),
// idempotent, and a DRY RUN by default — pass --yes to broadcast.
const IDENTITY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;
const AGENT_ID = 115n;
const NEW_API = "https://conatus.rectorspace.com/api";

async function main(): Promise<void> {
  const account = accountFromEnv();
  const client = createWalletClient({ account, chain: mantleMainnet, transport: http() }).extend(publicActions);

  const [current, owner] = await Promise.all([
    client.readContract({ address: IDENTITY, abi: identityRegistryAbi, functionName: "tokenURI", args: [AGENT_ID] }),
    client.readContract({ address: IDENTITY, abi: identityRegistryAbi, functionName: "ownerOf", args: [AGENT_ID] }),
  ]);

  // Safety: only the token owner may setAgentURI, and we must be updating OUR agent.
  if (getAddress(owner as string) !== getAddress(account.address)) {
    throw new Error(`agent #${AGENT_ID} owner is ${owner}, but signer is ${account.address} — refusing.`);
  }

  const b64 = (current as string).split(",")[1];
  if (!(current as string).startsWith("data:application/json;base64,") || !b64) {
    throw new Error(`tokenURI is not the expected inline data: URI — refusing. Current: ${(current as string).slice(0, 80)}…`);
  }
  const registration = JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as Record<string, unknown>;
  const endpoints = { ...((registration.endpoints as Record<string, unknown>) ?? {}) };
  const oldApi = endpoints.api;

  console.log(`signer / owner : ${account.address}`);
  console.log(`registry       : ${IDENTITY}  (Mantle mainnet ${MANTLE_MAINNET_ID})`);
  console.log(`endpoints.web  : ${endpoints.web}`);
  console.log(`endpoints.api  : ${oldApi}   ->   ${NEW_API}`);

  if (oldApi === NEW_API) {
    console.log("\nAlready correct — endpoints.api unchanged. Nothing to broadcast.");
    return;
  }

  const updated = { ...registration, endpoints: { ...endpoints, api: NEW_API } };
  const newUri = `data:application/json;base64,${Buffer.from(JSON.stringify(updated), "utf8").toString("base64")}`;
  console.log("\nUPDATED registration:\n" + JSON.stringify(updated, null, 2));

  if (!process.argv.includes("--yes")) {
    console.log("\nDRY RUN — rerun with --yes to broadcast setAgentURI on mainnet.");
    return;
  }

  const { request } = await client.simulateContract({
    address: IDENTITY, abi: identityRegistryAbi, functionName: "setAgentURI", args: [AGENT_ID, newUri], account,
  });
  const txHash = await client.writeContract(request);
  console.log(`\nbroadcast: ${txHash} — waiting for receipt…`);
  const rcpt = await client.waitForTransactionReceipt({ hash: txHash });
  console.log(`✓ setAgentURI ${rcpt.status} in block ${rcpt.blockNumber}`);
  console.log(`  ${explorerTxUrl(MANTLE_MAINNET_ID, txHash)}`);
}

main().catch((e) => {
  console.error("updateAgentUri failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
