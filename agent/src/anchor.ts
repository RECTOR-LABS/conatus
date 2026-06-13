import { publicClientFor, explorerTxUrl, MANTLE_SEPOLIA_ID } from "./chain";
import { walletClientFromEnv } from "./wallet";
import { auditAttestationAbi } from "./abis";
import { pinReport, type PinResult } from "./ipfs";
import type { AuditReport } from "./schema";

export interface SimulateAttestArgs {
  attestationAddress: `0x${string}`;
  account: `0x${string}`;
  targetHash: `0x${string}`;
  findingsURI: string;
  riskScore: number;
  agentId: bigint;
  chainId?: number;
  rpcUrl?: string;
}

/**
 * Dry-run `attest()` via eth_call from the agent wallet — proves the write would succeed
 * (and that `onlyAttester` rejects others) WITHOUT broadcasting. `account` is just an address,
 * so no private key is required.
 */
export async function simulateAttest(args: SimulateAttestArgs) {
  const client = publicClientFor(args.chainId ?? MANTLE_SEPOLIA_ID, args.rpcUrl);
  return client.simulateContract({
    address: args.attestationAddress,
    abi: auditAttestationAbi,
    functionName: "attest",
    args: [args.targetHash, args.findingsURI, args.riskScore, args.agentId],
    account: args.account,
  });
}

export interface AnchorOptions {
  attestationAddress: `0x${string}`;
  agentId: bigint;
  chainId?: number;
  pk?: string;
  rpcUrl?: string;
  ipfsJwt?: string;
}

/** A mined-but-reverted attest must never pass silently into readback/verification. */
export function assertReceiptSuccess(receipt: { status: "success" | "reverted" }, txUrl: string): void {
  if (receipt.status !== "success") {
    throw new Error(`attest tx reverted on-chain (status=${receipt.status}): ${txUrl}`);
  }
}

export interface AnchorResult {
  txHash: `0x${string}`;
  findingsURI: string;
  ipfsBackend: PinResult["backend"];
  explorerUrl: string;
  targetHash: `0x${string}`;
  riskScore: number;
}

/**
 * The `anchor_attestation` tool: pin the report, then write the verdict on-chain via
 * AuditAttestation.attest(targetHash, findingsURI, riskScore, agentId). Simulates first so a
 * would-be revert fails fast (no wasted broadcast), then sends and waits for the receipt.
 */
export async function anchorAttestation(report: AuditReport, opts: AnchorOptions): Promise<AnchorResult> {
  const chainId = opts.chainId ?? MANTLE_SEPOLIA_ID;
  const targetHash = report.target.targetHash as `0x${string}`;
  const pin = await pinReport(report, { jwt: opts.ipfsJwt });

  const wallet = walletClientFromEnv(chainId, { pk: opts.pk, rpcUrl: opts.rpcUrl });
  const publicClient = publicClientFor(chainId, opts.rpcUrl);

  const { request } = await publicClient.simulateContract({
    address: opts.attestationAddress,
    abi: auditAttestationAbi,
    functionName: "attest",
    args: [targetHash, pin.uri, report.riskScore, opts.agentId],
    account: wallet.account,
  });
  const txHash = await wallet.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  assertReceiptSuccess(receipt, explorerTxUrl(chainId, txHash));

  return {
    txHash,
    findingsURI: pin.uri,
    ipfsBackend: pin.backend,
    explorerUrl: explorerTxUrl(chainId, txHash),
    targetHash,
    riskScore: report.riskScore,
  };
}
