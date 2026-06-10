import "../loadEnv";
import { fileURLToPath } from "node:url";
import { runAudit } from "../audit/runAudit";
import { synthesizeAudit } from "../synthesis";
import { anchorAttestation, simulateAttest } from "../anchor";
import { publicClientFor, MANTLE_SEPOLIA_ID } from "../chain";
import { auditAttestationAbi } from "../abis";
import { pinReport } from "../ipfs";
import { accountFromEnv } from "../wallet";

/**
 * Headless end-to-end: deterministic audit -> LLM synthesis -> on-chain attestation.
 * Run with `pnpm e2e`. This BROADCASTS a real transaction on Mantle Sepolia (spends MNT, writes
 * under our ERC-8004 agentId) — it is intentionally outside the test suite.
 */
const VAULT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Vault {
    address public owner;
    mapping(address => uint256) public balances;
    constructor() { owner = msg.sender; }
    function deposit() external payable { balances[msg.sender] += msg.value; }
    function withdraw() external {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "no balance");
        (bool ok, ) = msg.sender.call{value: bal}("");
        require(ok, "send failed");
        balances[msg.sender] = 0;
    }
    function setOwner(address newOwner) external { owner = newOwner; }
}
`;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || /^PLACEH/i.test(v)) throw new Error(`${name} is missing or a placeholder in .env`);
  return v;
}

async function main(): Promise<void> {
  const attestationAddress = requireEnv("ATTESTATION_ADDR") as `0x${string}`;
  const agentId = BigInt(requireEnv("AGENT_ID"));
  const slitherBin = process.env.SLITHER_BIN ?? fileURLToPath(new URL("../../../.venv/bin/slither", import.meta.url));
  // Force the data-URI fallback when the Pinata JWT is absent/placeholder.
  const rawJwt = process.env.IPFS_PINNING_JWT;
  const ipfsJwt = !rawJwt || /^PLACEH/i.test(rawJwt) ? "" : rawJwt;
  const dryRun = process.argv.includes("--dry-run") || process.env.E2E_DRY_RUN === "1";

  console.log("1/3  Deterministic audit (Slither + Mantle gas)…");
  const base = await runAudit(VAULT, { contractName: "Vault", slitherBin });
  console.log(`     incomplete=${base.incomplete}  deterministic riskScore=${base.riskScore}  findings=${base.findings.length}`);

  console.log("2/3  LLM synthesis (OpenRouter)…");
  const synth = await synthesizeAudit(base, VAULT);
  console.log(`     model=${synth.model}  riskScore=${synth.riskScore}  findings=${synth.findings.length}`);
  console.log(`     ${synth.summary}`);

  console.log(`3/3  ${dryRun ? "Simulate attest (DRY RUN — eth_call, no broadcast)…" : "Anchor on-chain (Mantle Sepolia)…"}`);
  if (dryRun) {
    const pin = await pinReport(synth, { jwt: ipfsJwt });
    const account = accountFromEnv();
    const sim = await simulateAttest({
      attestationAddress,
      account: account.address,
      targetHash: synth.target.targetHash as `0x${string}`,
      findingsURI: pin.uri,
      riskScore: synth.riskScore,
      agentId,
    });
    console.log(`     pinned (backend=${pin.backend}); attest() simulated OK — would call ${sim.request.functionName}(…, riskScore=${synth.riskScore}, agentId=${agentId}). No state written.`);
    console.log("\n✓ DRY RUN: full pipeline validated (audit -> synthesis -> simulate). Ready for the live broadcast.");
    return;
  }
  const res = await anchorAttestation(synth, { attestationAddress, agentId, ipfsJwt });
  console.log(`     tx:        ${res.txHash}`);
  console.log(`     explorer:  ${res.explorerUrl}`);
  console.log(`     ipfs:      ${res.findingsURI.slice(0, 64)}…  (backend=${res.ipfsBackend})`);

  const pub = publicClientFor(MANTLE_SEPOLIA_ID);
  const [riskScore, findingsURI, onchainAgentId] = await pub.readContract({
    address: attestationAddress,
    abi: auditAttestationAbi,
    functionName: "getAttestation",
    args: [res.targetHash],
  });
  console.log(`     readback:  riskScore=${riskScore}  agentId=${onchainAgentId}  uriLen=${findingsURI.length}`);
  if (Number(riskScore) !== synth.riskScore || onchainAgentId !== agentId) {
    throw new Error("Readback mismatch — on-chain verdict does not match the synthesized report.");
  }
  console.log("\n✓ First on-chain AI verdict anchored and verified.");
}

main().catch((e) => {
  console.error("E2E failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
