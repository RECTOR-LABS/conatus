<!-- Satellite context file — extends the global hub (~/.claude/CLAUDE.md | ~/.pi/agent/AGENTS.md). Host-neutral; project-specific only. Do not duplicate hub standards here. -->

# Conatus

> Autonomous on-chain AI smart-contract audit agent for Mantle. 🏆 **Grand Champion — Mantle Turing Test Hackathon 2026** + **Best in Track — Dev Tool**.

**Live:** https://conatus.rectorspace.com · **Mantle mainnet 5000:** `0x94f22E008d0a8825850491170d97ba487Ed9E040` · **ERC-8004 agent #115** · 138 tests passing · MIT.

## Stack

- **Agent:** autonomous on-chain AI audit agent (`agent/`)
- **Contracts:** Solidity (`contracts/`) on Mantle
- **Web:** Next.js (`web/`, Vercel — `vercel.json`)
- Deploy via `deploy/`

## Structure

`agent/` · `contracts/` · `web/` · `deploy/` · `docs/` (incl. `docs/marketing/conatus-hero.png`) · `SPEC.md` · `PLAN.md` · `CORE.md` · `README.md`.

## Notes

- See `SPEC.md` (design), `PLAN.md` (build plan), `CORE.md` (shared core) for the audit-agent architecture.
- Deployed on Mantle mainnet (chain 5000). ERC-8004 agent registration #115.