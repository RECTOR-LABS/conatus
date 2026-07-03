// Evidence constants for the /judges page. Every value here is real and verified
// (on-chain reads 2026-07-03, EIP-8004 spec, RECTOR-LABS/conatus @ main). Facts stay exact.

export type FootnoteType = "eip" | "source" | "chain" | "test";
export interface FootnoteDef {
  id: string;
  type: FootnoteType;
  label: string;
  href: string;
}

const GH = "https://github.com/RECTOR-LABS/conatus/blob/main";
export const EIP_URL = "https://eips.ethereum.org/EIPS/eip-8004";
export const EIP_SELF_FEEDBACK_QUOTE =
  "The feedback submitter MUST NOT be the agent owner or an approved operator for agentId.";

export const MAINNET = {
  explorer: "https://mantlescan.xyz",
  chainId: 5000,
  agentId: 115,
  attestation: "0x94f22E008d0a8825850491170d97ba487Ed9E040",
  identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  owner: "0x6BB456d26AB74892d02AA0178403A9d54b5f631F",
  rater: "0x7551A2163B2201fDAFF6C87e0Ace0e73c1FbF135",
  // Anchored Vault verdict — riskScore 60, agent #115, Sonnet 5 (Attested event decoded on-chain 2026-07-03).
  verdictTx: "0x072811b7bc183293cd96aac2e6e791cb5c6ae6974c06fedbba9ba02fc70367fe",
  vaultTarget: "0x8d88b4080d363f6c6a98ee4b978989deb516a6ac1a1a8442a4675adc1eca5f67", // the score-60 demo Vault target
} as const;

// The real on-chain ratings for #115. NOTE: these belong to a *different* audit than the demo Vault —
// this audited contract (targetHash below) scored 87 on-chain, NOT 60. Never conflate the two.
export const REPUTATION: { dimension: string; value: number }[] = [
  { dimension: "audit:accuracy", value: 90 },
  { dimension: "audit:coverage", value: 85 },
  { dimension: "audit:actionability", value: 88 },
];
export const RATED_TARGET = "0xda6bf76b83de4697eeda12f05774a5daf9a62b2162214a06ba14b2cb563e565d";

export interface DemoRating {
  rater: string;
  value: number;
  reputation: number;
  proofOfConsumption: boolean;
  label: string;
}
// One real rater (has standing + consumed the audit) among 10 throwaway sybil wallets.
export const SYBIL_DEMO: DemoRating[] = [
  { rater: MAINNET.rater, value: 90, reputation: 100, proofOfConsumption: true, label: "real client" },
  ...Array.from({ length: 10 }, (_, i) => ({
    rater: `0x5ceb…${(i + 10).toString(16)}`,
    value: 100,
    reputation: 0,
    proofOfConsumption: false,
    label: `sybil #${i + 1}`,
  })),
];

export const FOOTNOTES: FootnoteDef[] = [
  { id: "eip-self", type: "eip", label: "EIP-8004 §Reputation Registry — feedback submitter must not be the agent owner/operator", href: `${EIP_URL}#reputation-registry` },
  { id: "src-give", type: "source", label: "giveFeedback.ts — rating must come from a wallet that is NOT the agent", href: `${GH}/agent/scripts/giveFeedback.ts#L15-L33` },
  { id: "chain-rep", type: "chain", label: "Agent #115 reputation feedback on Mantle mainnet (ReputationRegistry)", href: `${MAINNET.explorer}/address/${MAINNET.reputationRegistry}` },
  { id: "src-feedback", type: "source", label: "feedback.ts — keccak feedbackHash binds a rating to its exact payload", href: `${GH}/agent/src/feedback.ts#L51-L59` },
  { id: "chain-owner", type: "chain", label: "Agent #115 owner wallet on Mantle mainnet", href: `${MAINNET.explorer}/address/${MAINNET.owner}` },
  { id: "src-scoring", type: "source", label: "scoring.ts — the deterministic risk rubric (pure function of findings)", href: `${GH}/agent/src/scoring.ts#L34-L41` },
  { id: "test-60", type: "test", label: "scoring.test.ts — CI pins computeRiskScore([critical/high]) === 60", href: `${GH}/agent/test/scoring.test.ts#L20-L22` },
  { id: "chain-verdict", type: "chain", label: "Anchored audit verdict (riskScore 60) on Mantle mainnet", href: `${MAINNET.explorer}/tx/${MAINNET.verdictTx}` },
  { id: "src-temp0", type: "source", label: "synthesis.ts — temperature 0 and 'assign NO numeric risk score'", href: `${GH}/agent/src/synthesis.ts#L186-L193` },
  { id: "src-guard", type: "source", label: "synthesis.ts — uncited LLM ops are dropped and counted (applyTriage)", href: `${GH}/agent/src/synthesis.ts#L47-L108` },
];

export function footnoteIndex(id: string): number {
  const i = FOOTNOTES.findIndex((f) => f.id === id);
  if (i === -1) throw new Error(`unknown footnote id: ${id}`);
  return i + 1;
}
