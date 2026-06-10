import { defineChain, createPublicClient, http } from "viem";

export const MANTLE_SEPOLIA_ID = 5003 as const;
export const MANTLE_MAINNET_ID = 5000 as const;

const SEPOLIA_RPC = "https://rpc.sepolia.mantle.xyz";
const MAINNET_RPC = "https://rpc.mantle.xyz";
const SEPOLIA_EXPLORER = "https://sepolia.mantlescan.xyz";
const MAINNET_EXPLORER = "https://mantlescan.xyz";

export const mantleSepolia = defineChain({
  id: MANTLE_SEPOLIA_ID,
  name: "Mantle Sepolia Testnet",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: { default: { http: [SEPOLIA_RPC] } },
  blockExplorers: { default: { name: "MantleScan", url: SEPOLIA_EXPLORER } },
  testnet: true,
});

export const mantleMainnet = defineChain({
  id: MANTLE_MAINNET_ID,
  name: "Mantle",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: { default: { http: [MAINNET_RPC] } },
  blockExplorers: { default: { name: "MantleScan", url: MAINNET_EXPLORER } },
});

export function chainFor(chainId: number) {
  return chainId === MANTLE_MAINNET_ID ? mantleMainnet : mantleSepolia;
}

/** Read-only viem client for the given Mantle chain. */
export function publicClientFor(chainId: number, rpcUrl?: string) {
  const chain = chainFor(chainId);
  return createPublicClient({ chain, transport: http(rpcUrl ?? chain.rpcUrls.default.http[0]) });
}

function explorerBase(chainId: number): string {
  return chainId === MANTLE_MAINNET_ID ? MAINNET_EXPLORER : SEPOLIA_EXPLORER;
}
export const explorerTxUrl = (chainId: number, txHash: string) => `${explorerBase(chainId)}/tx/${txHash}`;
export const explorerAddressUrl = (chainId: number, addr: string) => `${explorerBase(chainId)}/address/${addr}`;
