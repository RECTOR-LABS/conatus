import { createWalletClient, createPublicClient, custom, http, type WalletClient } from "viem";
import { mantleSepolia, RPC_URL, CHAIN_ID, EXPLORER_URL } from "./constants";

export const publicClient = createPublicClient({ chain: mantleSepolia, transport: http(RPC_URL) });

type Eip1193 = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };

function injected(): Eip1193 {
  const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
  if (!eth) throw new Error("No injected wallet found — install Rabby or MetaMask.");
  return eth;
}

/** Connect the injected wallet and make sure it's on Mantle Sepolia (adds the chain if unknown). */
export async function connectWallet(): Promise<{ client: WalletClient; address: `0x${string}` }> {
  const eth = injected();
  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as `0x${string}`[];
  const address = accounts[0];
  if (!address) throw new Error("Wallet returned no account.");
  const hexId = `0x${CHAIN_ID.toString(16)}`;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: hexId,
        chainName: "Mantle Sepolia Testnet",
        nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
        rpcUrls: [RPC_URL],
        blockExplorerUrls: [EXPLORER_URL],
      }],
    });
  }
  const client = createWalletClient({ account: address, chain: mantleSepolia, transport: custom(eth) });
  return { client, address };
}
