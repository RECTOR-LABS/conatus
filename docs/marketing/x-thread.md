# Conatus — X submission thread (#MantleAIHackathon)

Submission via X is mandatory: thread with #MantleAIHackathon incl. pitch, demo video, GitHub, Mantle contract address. Register at https://dorahacks.io/hackathon/mantleturingtesthackathon2026

Handles: @Mantle_Official (main). Optional extra tags: @HackQuest_ , @OpenBuildxyz.

---

**1/** 🖼️ `conatus-infographic.png`

Tools give you a report. Conatus gives you a record.

An autonomous AI smart-contract auditor where every verdict is an on-chain, identity-bound, reputation-accruing transaction — live on @Mantle_Official mainnet.

The first audit agent native to ERC-8004 🧵

#MantleAIHackathon

---

**2/** 🖼️ `shot-1-verdict.jpg`

How it works: paste a contract → Slither + Mantle gas heuristics → an LLM re-rates the findings.

On this Vault it caught what the tools missed — an unprotected setOwner() (anyone can seize ownership) — and re-rated the reentrancy to CRITICAL.

Every AI change is recorded.

---

**3/** 🖼️ `shot-2-mainnet-proof.jpg`

Then it anchors the verdict on-chain.

Not a PDF — a real transaction on Mantle mainnet, paid in real MNT, bound to the agent's ERC-8004 identity. The riskScore is recomputable from the pinned report.

Don't trust the auditor. Check the chain. ↓

---

**4/** 🖼️ `shot-3-reputation.jpg`

The part with zero prior art: on-chain audit reputation.

Third parties rate every audit — accuracy, coverage, actionability — on Mantle's ReputationRegistry. The contract blocks self-feedback, so Conatus literally cannot rate itself.

A reputation it has to defend.

---

**5/** (no image)

Built natively on @Mantle_Official's ERC-8004 stack (identity + reputation) — the infra Mantle shipped to make on-chain agents real.

Slither × Mantle Arsia gas model × Claude via OpenRouter.

Honest framing: first-pass triage, not a formal audit.

---

**6/** (no image)

Try it — paste a contract, watch it go on-chain:

▶️ Demo + live app: conatus.rectorspace.com/pitch
💻 github.com/RECTOR-LABS/conatus
⛓️ AuditAttestation 0x94f22E008d0a8825850491170d97ba487Ed9E040 · Mantle 5000

#MantleAIHackathon

---

## Submission checklist (per DoraHacks rules)
- [x] Pitch — tweets 1–5
- [x] Demo video — conatus.rectorspace.com/pitch (embedded) / blob URL
- [x] GitHub — github.com/RECTOR-LABS/conatus
- [x] Mantle contract address — 0x94f22E008d0a8825850491170d97ba487Ed9E040 (mainnet 5000)
- [x] #MantleAIHackathon on tweets 1 & 6
- [ ] Register the BUIDL on DoraHacks + paste the thread link
