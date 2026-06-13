import { createWalletClient, http, type Account } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chainFor, MANTLE_SEPOLIA_ID } from "./chain";

/** The Conatus agent account (CORE.md WalletAdapter, KeyWallet variant) from AGENT_PRIVATE_KEY. */
export function accountFromEnv(pk?: string): Account {
  const key = pk ?? process.env.AGENT_PRIVATE_KEY;
  if (!key) throw new Error("AGENT_PRIVATE_KEY is not set");
  const hex = key.startsWith("0x") ? key : `0x${key}`;
  return privateKeyToAccount(hex as `0x${string}`);
}

/** Write-capable viem client bound to the agent account + a Mantle chain. */
export function walletClientFromEnv(chainId: number = MANTLE_SEPOLIA_ID, opts: { pk?: string; rpcUrl?: string } = {}) {
  const chain = chainFor(chainId);
  return createWalletClient({
    account: accountFromEnv(opts.pk),
    chain,
    transport: http(opts.rpcUrl ?? chain.rpcUrls.default.http[0]),
  });
}
