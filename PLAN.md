# Conatus — Plan

**Window:** today → **Jun 15, 2026 22:59** submission. ~9 days. Solo/tiny team. The shared core (CORE.md) is assumed already working — Conatus is the Mantle/ERC-8004/audit layer on top.

## Setup (Day 0 — half day)
- **Env (all via env vars, never committed):** `MANTLE_RPC_URL` (`https://rpc.sepolia.mantle.xyz`), `MANTLE_CHAIN_ID=5003`, `AGENT_PRIVATE_KEY` (testnet deployer/agent wallet), `LLM_API_KEY` (provider per CORE.md), `IPFS_PINNING_JWT` (Pinata), `IDENTITY_REGISTRY_ADDR` (default `0x8004A818BFB912233c491871b3d84c89A494BD9e`, override if Mantle differs), `ATTESTATION_ADDR` (filled post-deploy). Ship `.env.example` only.
- **Faucet:** fund deployer with testnet MNT via `https://faucet.mantle.xyz` (fallback: bridge). Verify balance on `sepolia.mantlescan.xyz`.
- **Tooling:** Foundry (`forge`/`cast`), Node/pnpm, viem, Slither (+ solc) in a container, Pinata account. Add a Mantle chain object to viem.
- **Repo:** public; README skeleton + `CORE.md` reference + MIT license + `.gitignore` (`.env`, keys, `out/`, `cache/`).

## Definition of Done (the bar — clears gate + every submission requirement)
1. `AuditAttestation` **deployed + verified** on Mantle Sepolia (5003), address in README, on `sepolia.mantlescan.xyz`.
2. Conatus **registered as an ERC-8004 agent** on Mantle; `agentId` rendered in UI.
3. A real audit produces a report → IPFS → **on-chain `attest()` tx** (the callable AI function), linked from the UI.
4. **Public Next.js frontend** live (Vercel); agent/analysis service on a container.
5. **Demo video ≥2 min** recorded; **one-line pitch** + README complete; **no secrets in repo**.
6. Reputation `giveFeedback` round-trips against the agent's `agentId`.
> Hitting 1–5 satisfies the qualification gate **and** all six "20 Project Deployment Award" conditions.

## Day-by-day

**Day 1 — De-risk identity + contract skeleton (highest-risk first)**
- Confirm whether ERC-8004 registries exist on Mantle Sepolia (read `erc-8004-contracts` deployments + probe address on explorer). **Decision branch:** present → use it; absent → add CREATE2 deploy of `IdentityRegistry` to our deploy script. *Resolves the #1 unknown before anything depends on it.*
- Scaffold `AuditAttestation.sol` + Foundry tests (`attest`/`getAttestation`, event, 0–100 score bound).
- Wire viem Mantle client; smoke-test a `cast` tx on 5003.

**Day 2 — Deploy + verify on Mantle (clear the gate early)**
- Deploy `AuditAttestation` to Sepolia 5003; **verify on `sepolia.mantlescan.xyz`**. Gate cleared on day 2 → eligible for the early-deploy award.
- Register Conatus's ERC-8004 identity (`register` + IPFS registration file); capture `agentId`. Render nothing yet — just persist + log.

**Day 3 — Audit toolchain (the AI substance)**
- `slither_scan` tool: sandboxed Slither → normalized findings schema (severity, range, rationale).
- `mantle_gas_review` tool: heuristics over calldata size / storage writes / DA cost in MNT terms.
- Register both as core tools; dry-run on 2–3 sample contracts (a known-vulnerable + a clean one).

**Day 4 — Agent synthesis + on-chain anchor (end-to-end spine)**
- LLM synthesis pass: merge tool outputs → ranked, **cited** report JSON; strict "no fabricated pass on tool failure" guard.
- `anchor_attestation` tool: pin report to IPFS → `attest(targetHash, findingsURI, riskScore, agentId)` on 5003.
- **Milestone: full pipeline paste→report→on-chain tx works headless.**

**Day 5 — Frontend**
- Next.js: paste source/address → report view (severity-grouped, citations) → Explorer tx link → ERC-8004 identity card (`tokenURI`) + reputation summary (`getSummary`).
- Deploy frontend to Vercel; point at the container'd agent service (CORS/env wired).

**Day 6 — Reputation loop + hardening**
- `giveFeedback` button → ReputationRegistry; render updated summary.
- Error/loading/empty states; input validation (reject non-Solidity, size caps); a11y pass; confirm zero secrets in the public repo (grep history).

**Day 7 — Polish + README**
- README: pitch, architecture, **CORE.md** link, env-var table, deployed addresses, run/deploy steps, track declaration, honesty note ("first-pass triage, not a formal audit").
- Tighten UI; sample audits as fixtures for the demo.

**Day 8 — Demo video + dry-run submission**
- Record ≥2 min: paste-to-audit → IPFS → on-chain attestation → Explorer → identity/reputation. One-line pitch finalized.
- Full DoraHacks submission dry-run against the checklist.

**Day 9 (buffer, → Jun 15 22:59)** — fix fallout, optional **mainnet 5000** deploy if testnet is rock-solid and MNT is available, final submit. **Submit with ≥12h margin — do not touch the deadline.**

## Honest feasibility verdict
**Achievable for this builder in this window — high confidence**, *conditional on the shared core (CORE.md) already working*. The Conatus-specific surface is small and squarely in the builder's wheelhouse: a ~50-line attestation contract, an ERC-8004 registration call with a well-documented interface, two analysis tools wrapping Slither + a gas heuristic, an LLM synthesis pass, and a CRUD-simple Next.js frontend. The audit domain *is* his audit-proven background; TS/Next.js is home turf.

**The one schedule risk** is the Day-1 ERC-8004-on-Mantle unknown — but it's bounded: worst case we CREATE2-deploy the registry ourselves to the same canonical address, which is a known, scripted operation. **Front-loading the deploy+verify to Day 2 banks the qualification gate (and likely the early-deploy award) with a full week of buffer** — the rest is product polish against an already-cleared bar. If the core were *not* ready, this verdict flips to red; that dependency is the gating assumption.

If time compresses, cut in this order: reputation `giveFeedback` (Day 6) → `mantle_gas_review` depth → mainnet deploy. The irreducible core that must ship: register identity → audit → on-chain `attest` verified on Mantle Explorer → public frontend → 2-min video.
