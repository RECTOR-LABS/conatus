import { defineChain } from "viem";

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 5003);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.sepolia.mantle.xyz";
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://sepolia.mantlescan.xyz";
export const ATTESTATION_ADDR = (process.env.NEXT_PUBLIC_ATTESTATION_ADDR ?? "0x94f22E008d0a8825850491170d97ba487Ed9E040") as `0x${string}`;
export const AGENT_ID = BigInt(process.env.NEXT_PUBLIC_AGENT_ID ?? 130);
export const IDENTITY_REGISTRY = (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY ?? "0x8004A818BFB912233c491871b3d84c89A494BD9e") as `0x${string}`;
export const REPUTATION_REGISTRY = (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY ?? "0x8004B663056A597Dffe9eCcC1965A193B7388713") as `0x${string}`;
export const SITE_URL = "https://conatus.rectorspace.com";

// Network-derived labels — the single source of truth for all chain-specific UI text.
export const IS_MAINNET = CHAIN_ID === 5000;
export const CHAIN_NAME = IS_MAINNET ? "Mantle" : "Mantle Sepolia";
export const CHAIN_LABEL = `${CHAIN_NAME} (${CHAIN_ID})`;

export const mantleChain = defineChain({
  id: CHAIN_ID,
  name: IS_MAINNET ? "Mantle" : "Mantle Sepolia Testnet",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "MantleScan", url: EXPLORER_URL } },
  testnet: !IS_MAINNET,
});

export const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
export const explorerTx = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const explorerAddress = (addr: string) => `${EXPLORER_URL}/address/${addr}`;
