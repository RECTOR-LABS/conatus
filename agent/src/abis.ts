/** Minimal ABIs for the contracts Conatus reads/writes. `as const` enables viem type inference. */

export const auditAttestationAbi = [
  { type: "function", name: "attester", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  {
    type: "function",
    name: "attest",
    stateMutability: "nonpayable",
    inputs: [
      { name: "targetHash", type: "bytes32" },
      { name: "findingsURI", type: "string" },
      { name: "riskScore", type: "uint8" },
      { name: "agentId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getAttestation",
    stateMutability: "view",
    inputs: [{ name: "targetHash", type: "bytes32" }],
    outputs: [
      { name: "riskScore", type: "uint8" },
      { name: "findingsURI", type: "string" },
      { name: "agentId", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "Attested",
    anonymous: false,
    inputs: [
      { name: "targetHash", type: "bytes32", indexed: true },
      { name: "agentId", type: "uint256", indexed: true },
      { name: "riskScore", type: "uint8", indexed: false },
      { name: "findingsURI", type: "string", indexed: false },
    ],
  },
] as const;

/** ERC-8004 IdentityRegistry — only the calls Conatus uses. */
export const identityRegistryAbi = [
  { type: "function", name: "register", stateMutability: "nonpayable", inputs: [{ name: "agentURI", type: "string" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "setAgentURI", stateMutability: "nonpayable", inputs: [{ name: "agentId", type: "uint256" }, { name: "newURI", type: "string" }], outputs: [] },
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }] },
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }] },
] as const;

/** ERC-8004 ReputationRegistry — feedback + summary (used in Plan 5's reputation loop). */
export const reputationRegistryAbi = [
  {
    type: "function",
    name: "giveFeedback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "value", type: "uint8" },
      { name: "valueDecimals", type: "uint8" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "feedbackURI", type: "string" },
      { name: "feedbackHash", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;
