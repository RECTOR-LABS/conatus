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

/** ERC-8004 ReputationRegistry — VERIFIED against erc-8004-contracts/ReputationRegistryUpgradeable.sol
 *  (master, fetched 2026-06-10). Note `value` is int128 (the earlier uint8 guess produced a wrong selector). */
export const reputationRegistryAbi = [
  {
    type: "function",
    name: "giveFeedback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "value", type: "int128" },
      { name: "valueDecimals", type: "uint8" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "feedbackURI", type: "string" },
      { name: "feedbackHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeFeedback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "feedbackIndex", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "readAllFeedback",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "clientAddresses", type: "address[]" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
      { name: "includeRevoked", type: "bool" },
    ],
    outputs: [
      { name: "clients", type: "address[]" },
      { name: "feedbackIndexes", type: "uint64[]" },
      { name: "values", type: "int128[]" },
      { name: "valueDecimals", type: "uint8[]" },
      { name: "tag1s", type: "string[]" },
      { name: "tag2s", type: "string[]" },
      { name: "revokedStatuses", type: "bool[]" },
    ],
  },
  {
    type: "function",
    name: "getClients",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "getLastIndex",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "clientAddress", type: "address" },
    ],
    outputs: [{ type: "uint64" }],
  },
  {
    type: "event",
    name: "NewFeedback",
    anonymous: false,
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "clientAddress", type: "address", indexed: true },
      { name: "feedbackIndex", type: "uint64", indexed: false },
      { name: "value", type: "int128", indexed: false },
      { name: "valueDecimals", type: "uint8", indexed: false },
      { name: "indexedTag1", type: "string", indexed: true },
      { name: "tag1", type: "string", indexed: false },
      { name: "tag2", type: "string", indexed: false },
      { name: "endpoint", type: "string", indexed: false },
      { name: "feedbackURI", type: "string", indexed: false },
      { name: "feedbackHash", type: "bytes32", indexed: false },
    ],
  },
] as const;
