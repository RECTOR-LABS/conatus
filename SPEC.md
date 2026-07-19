# Conatus — Spec

> An autonomous AI agent that audits Mantle smart contracts on demand, anchors each verdict on-chain, and carries a portable ERC-8004 identity + reputation. *Conatus* (Spinoza): the innate drive to persist and act.

> **Shared core:** The LLM agent runtime (tool-calling + planning loop), the on-chain execution adapter, and the wallet / account-abstraction adapter are defined in **[CORE.md](./CORE.md)** and reused across the Conatus / Conclave / Wisp campaign. **This spec does not redesign the core** — it specifies only Conatus's unique layer: the Mantle integration, the ERC-8004 identity binding, the audit toolchain, and the chosen track.

---

## 1. Hackathon context

| Field | Value |
|---|---|
| Event | Mantle **"The Turing Test Hackathon 2026"** (DoraHacks), virtual |
| Phase | Phase 2 — **"AI Awakening"**, **$100K** pool (total event $120K; Phase 1 "ClawHack" already ran) |
| **Submit by** | **Jun 15, 2026, 22:59** |
| **QUALIFICATION GATE** | Must **deploy on Mantle Network — mainnet OR testnet both accepted** (no real capital required). Verified on Mantle Explorer. |
| Identity | Participating agents are issued an **ERC-8004 agent-identity NFT** |
| Bonus | **"20 Project Deployment Award"** — first 20 projects to deploy on Mantle (mainnet *or* testnet), verified on Mantle Explorer, with ≥1 AI function callable on-chain, public frontend, demo video ≥2 min, open-source README |
| Judging | Technical Depth (AI×on-chain) **30%** · Innovation **25%** · Mantle Ecosystem Contribution **25%** · Product Completeness **20%** |
| Backers / tooling | Bybit, Byreal, Tencent Cloud, BGA; Byreal Agent Skills / Perps CLI / RealClaw, Bybit API, Python+Solidity templates |

**Chosen track: AI DevTools** — "gas-optimization tools and Mantle-specific audit assistants." This maps 1:1 onto the builder's audit-proven smart-contract background and is the single highest-leverage track for this profile.

> **Why not Agentic Wallets & Economy (the Solana-allowed track)?** It's the builder's home turf, but it routes the project to Solana + Byreal CLMM tooling, which scores *zero* on the **25% "Mantle Ecosystem Contribution"** axis and contributes nothing reusable to the Conatus/Conclave/Wisp **EVM** core. AI DevTools keeps us on Mantle, banks that 25%, and a reusable audit agent is a durable artifact. The Solana option is documented as Alt-B below in case the builder wants to hedge, but the recommendation is unambiguous: **build the Mantle audit assistant.**

---

## 2. Problem & target user

**User:** A Solidity developer or protocol team shipping to Mantle who wants a fast, *cited*, on-chain-verifiable first-pass audit before paying for a human review — and a public, tamper-evident record that the audit happened.

**Problem:** Mantle is an OP-derived modular L2 with EVM-equivalent execution but **distinct gas economics** (MNT-denominated gas; L2 execution is cheap, but the cost driver is L1 data-availability, so calldata size and storage writes dominate). Generic "audit my Solidity" LLM wrappers (a) miss Mantle-specific gas/cost advice, (b) hallucinate findings with no provenance, and (c) leave no verifiable trail. There's no lightweight tool that produces a *Mantle-aware* audit, **anchors the verdict on-chain so the result itself is a callable AI function**, and gives the auditing agent a **portable identity + reputation** that accrues across jobs.

**Why on-chain (not just an API):** The hackathon explicitly rewards "≥1 AI function callable on-chain" and "on-chain benchmarking of AI." Conatus writes each audit's verdict hash + score to Mantle and records it against its ERC-8004 identity, so the agent's track record is itself the benchmark.

---

## 3. Concept

### ✅ Recommended — **Conatus: the on-chain Mantle audit agent**

A web app + agent service where a user pastes Solidity source or a deployed Mantle address. Conatus:

1. **Plans & audits** via the shared core's tool-calling loop (CORE.md): static-analysis tools (Slither) + a Mantle-gas heuristics tool + an LLM reasoning pass produce a structured findings report (severity, location, rationale, suggested fix, est. gas/DA impact).
2. **Anchors on-chain** — writes a compact verdict to a small **`AuditAttestation`** contract on Mantle: `{ targetHash, findingsURI (IPFS), riskScore (0–100), agentId }`. This is the "AI function callable on-chain."
3. **Carries identity** — at setup, Conatus registers an **ERC-8004 identity NFT** on Mantle (`IdentityRegistry.register`) with a registration file describing its name, services (the audit A2A/MCP endpoint), and trust model. Each attestation references the agent's `agentId`; downstream, audit consumers can `giveFeedback` to the **ReputationRegistry**, so the agent's audit reputation is portable and on-chain.
4. **Demonstrates** — a public Next.js frontend shows the report, the Mantle Explorer link to the attestation tx, and the agent's identity/reputation card.

This is innovative (on-chain-attested, reputation-bearing audits — not a chat wrapper), technically deep (AI × on-chain × Mantle gas model × ERC-8004), and directly Mantle-contributing (a DevTool the ecosystem keeps using).

### Alternatives (brief)

- **Alt-A — Mantle gas-optimization profiler (same track).** Narrower: ingest a contract, simulate against Mantle's cost model (L2 exec + L1 DA), and emit a ranked diff of gas/calldata optimizations, attested on-chain. *Lower-risk, but thinner on the AI axis* — fold its gas heuristic into the recommended concept as one tool rather than shipping it standalone.
- **Alt-B — Agentic Wallets track on Solana (builder's home turf).** A Byreal-Skills-CLI-driven agent wallet (`@byreal-io/byreal-cli`, Solana CLMM DEX). Genuinely strong for this builder, but **forfeits the 25% Mantle axis** and the shared EVM core. Hedge only; not recommended.

---

## 4. MVP features (YAGNI-tight)

**In scope (the demoable spine):**
1. **Audit endpoint** — POST source/Mantle-address → structured findings JSON (severity-ranked, each finding cited to a line/range with rationale + fix). Core agent loop from CORE.md; tools: Slither + Mantle-gas heuristics + LLM synthesis.
2. **`AuditAttestation` contract** on Mantle (Sepolia testnet 5003 for the gate; mainnet 5000 optional stretch) — `attest(bytes32 targetHash, string findingsURI, uint8 riskScore, uint256 agentId)` emitting an event; **verified on the Mantle Explorer**. This is the callable on-chain AI function.
3. **ERC-8004 identity** — register Conatus once on Mantle; store `agentId`; reference it in every attestation. Registration file per the EIP-8004 schema.
4. **Findings storage** — full report pinned to IPFS; only `findingsURI` + hash go on-chain (keeps calldata/DA cost low — itself a Mantle-aware choice).
5. **Public frontend** (Next.js) — paste-to-audit, render report, Explorer tx link, identity/reputation card.
6. **Reputation hook** — one button: a consumer can `giveFeedback(agentId, score, …)` to the ReputationRegistry post-audit (closes the "on-chain benchmark" loop).

**Explicitly NOT in MVP (non-goals → §6):** multi-file/imports resolution, formal verification, fix auto-PRs, paid x402 metering, mainnet-only deploy, Validation Registry validators, multi-agent debate.

---

## 5. Architecture

### Stack
- **Agent runtime + execution/wallet adapters:** per **CORE.md** (LLM tool-calling + planning loop; pluggable on-chain execution adapter; wallet/account-abstraction adapter). Conatus configures the execution adapter for **Mantle** and registers three tools: `slither_scan`, `mantle_gas_review`, `anchor_attestation`.
- **Language/app:** TypeScript end-to-end. Next.js (App Router) frontend + agent API route/service. Vercel-deployable.
- **Contracts:** Solidity (`AuditAttestation`) via **Foundry** (Mantle is EVM-equivalent, Foundry works unchanged). ERC-8004 registries are **reused, not authored** (see identity below).
- **Chain client:** **viem** (matches the ERC-8004 reference snippets) with a Mantle chain config.
- **Static analysis:** Slither invoked in a sandboxed subprocess; output normalized to the findings schema.

### Mantle chain (verified against docs)
| | Mainnet | Sepolia Testnet (**gate target**) |
|---|---|---|
| Chain ID | **5000** | **5003** |
| RPC (HTTPS) | `https://rpc.mantle.xyz` | `https://rpc.sepolia.mantle.xyz` |
| RPC (WSS) | `wss://wss.mantle.xyz` | — |
| Explorer | `https://mantlescan.xyz` / `https://explorer.mantle.xyz` | `https://sepolia.mantlescan.xyz` |
| Gas token | **MNT** | **MNT** |
| Faucet | — | `https://faucet.mantle.xyz` |

Mantle is an OP-Stack-derived **modular L2** (EigenDA for data availability), **EVM-equivalent** — "existing contracts and developer tooling — Hardhat, Foundry, ethers.js, viem — work without changes" (Mantle docs). Cost model: cheap L2 execution, **L1/DA cost dominated by calldata + storage** → drives the "hash on-chain, report on IPFS" design and the gas-review tool's heuristics.

### Key SDKs / contracts (real doc refs)
- **ERC-8004 `IdentityRegistry`** — canonical address **`0x8004A818BFB912233c491871b3d84c89A494BD9e`**, deployed via **CREATE2** (deterministic, same address across EVM chains). Core calls used:
  - `register(string agentURI, MetadataEntry[] metadata) → uint256 agentId` (mints the ERC-721 identity; `agentWallet` auto-set to caller; emits `Registered(agentId, agentURI, owner)`).
  - `setAgentURI(uint256 agentId, string newURI)` (registration file as IPFS or base64 `data:` URI).
  - `tokenURI(uint256 agentId)` for the identity card.
  - Registration file schema (EIP-8004 `registration-v1`): `{ type, name, description, image, services:[{name:"A2A"|"MCP", endpoint, version}], registrations:[{agentId, agentRegistry:"eip155:<chainId>:<registry>"}], supportedTrust:["reputation"] }`.
- **ERC-8004 `ReputationRegistry`** — `giveFeedback(agentId, value, valueDecimals, tag1, tag2, endpoint, feedbackURI, feedbackHash)` and `getSummary(...)` for the reputation card.
- **Tooling to bootstrap identity (optional accelerator):** `create-8004-agent` (`npx create-8004-agent`) and **`agent0-sdk`** (`sdk.createAgent(...).setA2A/setMCP/registerIPFS()`), which wrap the registration + IPFS-pin + EIP-712 wallet-link flow. **Caveat:** their bundled `CHAINS` registry ships Base/Polygon/Monad/etc. but **not Mantle** — we add a Mantle entry or call `IdentityRegistry` directly via viem (preferred for control).
- **`AuditAttestation`** (ours, minimal):
  ```solidity
  event Attested(bytes32 indexed targetHash, uint256 indexed agentId, uint8 riskScore, string findingsURI);
  function attest(bytes32 targetHash, string calldata findingsURI, uint8 riskScore, uint256 agentId) external;
  function getAttestation(bytes32 targetHash) external view returns (uint8 riskScore, string memory findingsURI, uint256 agentId, uint256 timestamp);
  ```
  `riskScore` mirrors ERC-8004's 0–100 convention for easy reputation interop.

### Agent design
- **Planner→tools→synthesis** loop (CORE.md). System prompt scopes the agent to Solidity security + **Mantle cost model**; tools are deterministic where possible (Slither, gas heuristics) and the LLM is the synthesis/triage layer, *citing every finding to a source range*. No silent failures: tool errors surface as explicit report sections; the agent never fabricates a passing verdict on tool failure.
- **On-chain write** is a discrete tool (`anchor_attestation`) gated behind the wallet adapter → testnet by default.

### Data flow
```
User → Frontend (paste source / Mantle address)
     → Agent API (CORE runtime, Mantle execution adapter)
        ├─ slither_scan        → normalized findings
        ├─ mantle_gas_review   → calldata/storage/DA cost notes
        └─ LLM synthesis       → ranked, cited report (JSON)
     → pin report to IPFS                      → findingsURI + sha256
     → AuditAttestation.attest(targetHash, findingsURI, riskScore, agentId)  [Mantle Sepolia 5003]
        └─ tx → Mantle Explorer (verified)      ← "AI function callable on-chain"
     → Frontend renders report + Explorer link + ERC-8004 identity/reputation card
            ↳ optional: consumer → ReputationRegistry.giveFeedback(agentId, …)
```

### ERC-8004 identity (lifecycle)
1. **One-time:** Conatus's operator wallet calls `IdentityRegistry.register(agentURI, [...])` on the chosen Mantle chain → `agentId`. `agentURI` → IPFS registration file (services = the deployed audit endpoint).
2. **Per audit:** attestation carries `agentId` → track record accrues against identity.
3. **Reputation:** consumers `giveFeedback` → `getSummary` renders the agent's audit reputation. (Validation Registry intentionally out of scope — the spec itself notes it's "a design space.")

---

## 6. Non-goals
- Not a replacement for a human/formal audit; first-pass triage only (stated in-product).
- No multi-file import graph resolution / cross-contract dataflow in MVP.
- No fix auto-generation / PR bot.
- No paid x402 metering (the tooling supports it; deferred).
- No custom Validation Registry validator.
- No multi-agent debate / consensus (that's the *Conclave* repo's lane).
- No Solana path in the shipped product (Alt-B is a documented hedge only).

---

## 7. Risks & unknowns
- **🔴 ERC-8004 registry on Mantle — unverified.** The `0x8004…BD9e` address is deterministic via CREATE2 but I have **not confirmed it's deployed on Mantle Sepolia/mainnet**. *Mitigation:* Day 1, read the canonical `erc-8004/erc-8004-contracts` deployments list + probe the address on `sepolia.mantlescan.xyz`. If absent, the repo's deploy script CREATE2-deploys it to the same address ourselves (we control identity end-to-end either way). **This is the top de-risk item.**
- **🟡 Faucet throughput.** `faucet.mantle.xyz` MNT drip may be rate-limited; bridging testnet MNT is the fallback. Gas needs are tiny (a few attestations).
- **🟡 Slither in serverless.** Slither needs a Python+solc runtime; Vercel functions are a poor host. *Mitigation:* run the agent/analysis service on a small container (the builder's VPS) and keep only the Next.js frontend on Vercel.
- **🟡 IPFS pinning dependency.** Need a pinning provider (env-var key). *Mitigation:* Pinata (matches `agent0-sdk`'s default); a base64 `data:` URI fallback exists but **exceeds Mantle's per-tx gas allowance** for normal-sized reports, so a Pinata JWT (`IPFS_PINNING_JWT`) is required for production anchoring (verified 2026-07-19 — `attest()` with a `data:` URI needs ~4.3M gas vs ~116k for an `ipfs://` URI).
- **🟢 Mantle EVM parity** — low risk; Foundry/viem confirmed working unchanged per docs.
- **🟢 LLM provider** — set via env var (CORE.md). No keys in repo.
- **Gas-token nuance:** MNT (not ETH) is gas; ensure the wallet adapter funds MNT, and the gas-review tool reasons in MNT + DA terms, not generic gwei.

---

## 8. Submission checklist (mapped to THIS hackathon's exact deliverables)
- [ ] **Deployed contract on Mantle** (`AuditAttestation` + `agentId` registered) on **Sepolia testnet 5003** (mainnet 5000 optional) — *clears the qualification gate*.
- [ ] **Mantle Explorer verification** — contract verified + a real attestation tx linked on `sepolia.mantlescan.xyz`.
- [ ] **≥1 AI function callable on-chain** — `attest(...)` writes an AI-produced verdict on-chain (satisfies gate + Deployment Award).
- [ ] **Open-source repo + README** — public, with run/deploy instructions, the contract address, and `CORE.md` reference. **No secrets — env-var references only.**
- [ ] **Public frontend** — Next.js app live (Vercel) — required by the Deployment Award.
- [ ] **Demo video ≥2 min** — paste-to-audit → on-chain attestation → Explorer → ERC-8004 identity/reputation card.
- [ ] **One-line pitch** — see repo description.
- [ ] **ERC-8004 identity NFT** — Conatus registered; `agentId` shown in UI and referenced by attestations.
- [ ] **Track fit** — AI DevTools (Mantle audit assistant) — explicit in README.
- [ ] **(Stretch) "20 Project Deployment Award"** — deploy early; all six award conditions are already on this list.

---

**Doc sources (all current, fetched during drafting):**
- Hackathon: https://dorahacks.io/hackathon/mantleturingtesthackathon2026 · https://chainwire.org/2026/04/23/mantle-launches-turing-test-hackathon-2026-backed-by-tencent-cloud-bybit-byreal-and-bga/ · https://devhub.mantle.xyz/
- Mantle: https://docs.mantle.xyz/network/for-developers/resources-and-tooling/node-endpoints-and-providers · https://chainlist.org/chain/5000 · https://chainlist.org/chain/5003
- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004 · https://github.com/erc-8004/erc-8004-contracts · https://blog.quicknode.com/erc-8004-a-developers-guide-to-trustless-ai-agent-identity/
- Byreal (Alt-B): https://github.com/byreal-git/byreal-agent-skills · https://docs.byreal.io/developer/smart-contracts-and-api-and-sdk
