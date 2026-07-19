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

## Current state (as of 2026-07-15)

**Status: SHIPPED + WON.** 🏆 Grand Champion — Mantle Turing Test Hackathon 2026 + Best in Track (Dev Tool). Repo `main` = `7aaeef5`, clean, in sync with `origin/main`. **138 tests passing** (67 web / 61 agent / 10 contracts). Site LIVE at https://conatus.rectorspace.com (`/judges` → 200).

**Prod infra (DO NOT rebuild — all verified LIVE):**
- Prod fully on **Vercel** (merged to `main` → auto-deploy). Prod LLM = `anthropic/claude-sonnet-5`.
- Contract `AuditAttestation 0x94f22E008d0a8825850491170d97ba487Ed9E040` on Mantle mainnet (5000), ERC-8004 agent #115.
  - IdentityRegistry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` · ReputationRegistry `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`.
  - Agent #115 owner `0x6BB4…631F`. Agent wallet ~2.52 MNT.

**`/judges` page** (`web/app/judges/`, shipped PR #8 → `e20ef93`): interactive, cited answers to 3 Demo-Day judge questions; per-judge tabs (William/Vizta/Whisker); 6 island widgets; pure logic in `web/lib/judges.ts` (mirrors `agent/src/scoring.ts` 1:1). ALL explorer links use hardcoded `MAINNET.explorer` (mantlescan.xyz) — do NOT switch to env-driven `explorerAddress()` (it defaults to sepolia when `NEXT_PUBLIC_EXPLORER_URL` unset). Honesty invariants: sybil labeled live-vs-roadmap; 87 (rated audit `RATED_TARGET 0xda6bf76b83de…565d`) vs 60 (demo Vault `0x8d88b4…5f67`, anchor `0x072811b7…`) kept STRICTLY separate — never conflate.

**Latest handoff (detailed):** `~/Documents/secret/strategy/conatus/session-handoff-2026-07-03.md`. Older handoffs + spec/plan docs in the same dir. Read the latest handoff first when resuming.

## Open work (post-hackathon — RECTOR's pick)

1. ★ **Post-hackathon roadmap** — RECTOR's pick between:
   - (a) **A/B accuracy benchmark** vs a labeled known-exploit corpus (judges' #1 ask; /judges pre-answered framing but there is still NO formal benchmark), or
   - (b) **PoC exploit test generator** — LLM writes a *failing Foundry test* per finding (the differentiator, strong TDD candidate).
2. **Optional `/judges` polish** (deferred Minor review findings, non-blocking): a11y sweep (`aria-pressed` on toggle buttons in RatingAnatomy/SybilWeighting; `aria-live` on field-explainer/sim-result regions; low-contrast muted text) · unify two greens (widgets hardcode `emerald-400` vs page `--primary` mint token) · hero jump-nav · dead `MAINNET.chainId` field in `_data.ts`.
3. **Build the sybil roadmap** the `/judges` page promises (proof-of-consumption gate → staking) — currently honestly labeled "not built yet."
4. **Plan 17 (infra debt, deferred):** migrate core/sip/lumos off the dead HostKey VPS — separate from Conatus.

No active cross-session TODO for Conatus itself — the project is in a "shipped, won, now deciding what's next" holding pattern. Add a TODO when you commit to a roadmap lane.

## Verify state

```bash
bash ~/Documents/secret/strategy/conatus/preflight.sh        # expect 6/6 CLEAR
pnpm -C web test      # 67 web tests
pnpm -C agent test    # 61 agent tests
pnpm -C web typecheck && pnpm -C web lint && pnpm -C web build
curl -s -o /dev/null -w '%{http_code}\n' https://conatus.rectorspace.com/judges   # → 200
```

## Gotchas

- **BSD (macOS) `sed` doesn't support `\b`** — use `[[:<:]]`/`[[:>:]]` or space-delimited exact matches.
- `vercel env pull` reads `LLM_MODEL`/`LLM_BASE_URL` back as `""` (write-only-readback quirk) — verify via live `report.model`, NOT pull. Rollback lever = prod `LLM_MODEL` env.
- Cold start ~30-40s on first audit after idle (`preflight.sh --warm` to pre-warm).
- Merging to `main` auto-deploys Vercel prod; container (Slither/Foundry) rebuild + deploy ~105s.

## Notes

- See `SPEC.md` (design), `PLAN.md` (build plan), `CORE.md` (shared core) for the audit-agent architecture.
- Deployed on Mantle mainnet (chain 5000). ERC-8004 agent registration #115.