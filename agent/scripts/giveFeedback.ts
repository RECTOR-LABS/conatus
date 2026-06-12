import "../src/loadEnv";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chainFor, explorerTxUrl, MANTLE_SEPOLIA_ID, MANTLE_MAINNET_ID } from "../src/chain";
import { reputationRegistryAbi } from "../src/abis";
import { buildFeedbackPayload, encodeFeedbackUri, FEEDBACK_DIMENSIONS, type FeedbackDimension } from "../src/feedback";

// ReputationRegistry differs per network; override with REPUTATION_REGISTRY_ADDR if needed.
const REPUTATION_BY_CHAIN: Record<number, `0x${string}`> = {
  [MANTLE_SEPOLIA_ID]: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  [MANTLE_MAINNET_ID]: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
};
const ENDPOINT = "https://conatus.rectorspace.com";

/**
 * Demo/video fallback for the in-app rating: signs giveFeedback from a SECOND wallet
 * (the registry forbids self-feedback from the agent's owner/operators).
 *
 * Chain + agent are env-driven (MANTLE_CHAIN_ID, AGENT_ID), mirroring the e2e anchor entrypoint.
 *
 * Usage:
 *   MANTLE_CHAIN_ID=5000 AGENT_ID=115 FEEDBACK_PRIVATE_KEY=0x... pnpm tsx scripts/giveFeedback.ts \
 *     --target 0x<targetHash> --tx 0x<attestationTx> --risk 87 \
 *     --dimension audit:accuracy --score 95 [--comment "..."]
 */
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main(): Promise<void> {
  const pk = process.env.FEEDBACK_PRIVATE_KEY;
  if (!pk || /^PLACEH/i.test(pk)) throw new Error("FEEDBACK_PRIVATE_KEY missing — use a wallet that is NOT the agent wallet.");
  const chainId = Number(process.env.MANTLE_CHAIN_ID ?? MANTLE_SEPOLIA_ID);
  if (chainId !== MANTLE_SEPOLIA_ID && chainId !== MANTLE_MAINNET_ID) {
    throw new Error(`MANTLE_CHAIN_ID=${process.env.MANTLE_CHAIN_ID} is not a Mantle chain (expected ${MANTLE_SEPOLIA_ID} or ${MANTLE_MAINNET_ID})`);
  }
  const agentId = Number(process.env.AGENT_ID ?? 130);
  if (!Number.isInteger(agentId) || agentId <= 0) throw new Error(`AGENT_ID=${process.env.AGENT_ID} must be a positive integer`);
  const registry = (process.env.REPUTATION_REGISTRY_ADDR ?? REPUTATION_BY_CHAIN[chainId]) as `0x${string}`;
  const chain = chainFor(chainId);

  const target = arg("target") as `0x${string}` | undefined;
  const tx = arg("tx");
  const risk = Number(arg("risk"));
  const dimension = (arg("dimension") ?? "audit:accuracy") as FeedbackDimension;
  const score = Number(arg("score"));
  const comment = arg("comment");
  if (!target || !/^0x[0-9a-fA-F]{64}$/.test(target)) throw new Error("--target must be the 0x-prefixed 32-byte targetHash");
  if (!tx) throw new Error("--tx (attestation tx hash) is required");
  if (!Number.isInteger(risk) || risk < 0 || risk > 100) throw new Error("--risk must be 0–100");
  if (!(FEEDBACK_DIMENSIONS as readonly string[]).includes(dimension)) throw new Error(`--dimension must be one of ${FEEDBACK_DIMENSIONS.join(", ")}`);

  const payload = buildFeedbackPayload({ agentId, targetHash: target, attestationTx: tx, riskScore: risk, dimension, score, ...(comment ? { comment } : {}) });
  const { uri, hash } = encodeFeedbackUri(payload);

  const account = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`);
  const client = createWalletClient({ account, chain, transport: http() }).extend(publicActions);

  console.log(`Signing giveFeedback as ${account.address} on ${chain.name} (agentId ${agentId}, dimension ${dimension}=${score})…`);
  const { request } = await client.simulateContract({
    address: registry,
    abi: reputationRegistryAbi,
    functionName: "giveFeedback",
    args: [BigInt(agentId), BigInt(score), 0, dimension, target, ENDPOINT, uri, hash],
    account,
  });
  const txHash = await client.writeContract(request);
  await client.waitForTransactionReceipt({ hash: txHash });
  console.log(`✓ feedback on-chain: ${explorerTxUrl(chainId, txHash)}`);
}

main().catch((e) => {
  console.error("giveFeedback failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
