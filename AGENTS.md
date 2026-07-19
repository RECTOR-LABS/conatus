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

## Current state (as of 2026-07-19)

**Status: SHIPPED + WON.** 🏆 Grand Champion — Mantle Turing Test Hackathon 2026 + Best in Track (Dev Tool). Repo `main` = `7aaeef5`, clean, in sync with `origin/main`. **138 tests passing** (67 web / 61 agent / 10 contracts). Site LIVE at https://conatus.rectorspace.com (`/judges` → 200).

**Prod infra (DO NOT rebuild — all verified LIVE):**
- Prod fully on **Vercel** (merged to `main` → auto-deploy). Prod LLM = **`glm-5.2` via Ollama Cloud** @ `https://ollama.com/v1` (flipped 2026-07-19; was `anthropic/claude-sonnet-5` via OpenRouter). Dev LLM = same (`glm-5.2`). Verified via live `report.model` (env pull masks sensitive values as `[SENSITIVE]`).
- Contract `AuditAttestation 0x94f22E008d0a8825850491170d97ba487Ed9E040` on Mantle mainnet (5000), ERC-8004 agent #115.
  - IdentityRegistry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` · ReputationRegistry `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`.
  - Agent #115 owner `0x6BB4…631F` (= `0x6BB456d26AB74892d02AA0178403A9d54b5f631F`, derived from `AGENT_PRIVATE_KEY` — same wallet owns sepolia agent #130). **Agent wallet MNT balance ≈ 0.092 MNT as of 2026-07-19** (previously ~2.52 MNT — stale; spent down). Cheap L2 attests still affordable; top-up before broadcasting a batch.

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
- LLM is OpenAI-compatible via `openai` SDK: `LLM_API_KEY` + `LLM_MODEL` + `LLM_BASE_URL` (code defaults in `agent/src/synthesis.ts` are the legacy `anthropic/claude-sonnet-5` @ `https://openrouter.ai/api/v1` — env vars override at runtime; `LLM_BASE_URL` is read with empty-string guard → falls back to the OpenRouter default if unset/empty). Switching provider = env-only for `LLM_MODEL`/`LLM_BASE_URL` (no code change once the env-read fix is in). Current prod + dev: Ollama Cloud `glm-5.2` @ `https://ollama.com/v1` (supports `tools`/function-calling, required by `synthesis.ts`). **Gotcha:** use `https://ollama.com/v1`, NOT `https://api.ollama.com/v1` — the latter 301-redirects to `ollama.com` and the OpenAI SDK strips the `Authorization` header on cross-host redirects → 401. Model id is `glm-5.2` (the `:cloud` suffix is a CLI routing tag, invalid on the API). **Fix landed 2026-07-19:** `synthesis.ts` previously hardcoded the base URL to OpenRouter and ignored `LLM_BASE_URL` (latent bug — prod only worked because the default matched); now reads env.
- **Real audit verified** with GLM-5.2 via `E2E_DRY_RUN=1 pnpm -C agent e2e` (audit → synthesis → simulate, no broadcast): caught the VAULT reentrancy, added a Slither-missed access-control finding, respected the citation guardrail.
- `vercel env pull` reads `LLM_MODEL`/`LLM_BASE_URL` back as `"[SENSITIVE]"` (sensitive-value masking). Verify via live `report.model`, NOT pull. Rollback lever = prod `LLM_MODEL` env (but the old OpenRouter `LLM_API_KEY` was overwritten on Vercel during the Ollama flip — rollback to claude-sonnet-5 needs the OpenRouter key from RECTOR's vault).
- **BROADCAST (anchor=true) WORKS on prod via IPFS (fixed 2026-07-19).** `IPFS_PINNING_JWT` (Pinata, admin key `conatus-prod`) now set on Vercel prod + local secret store → `pinReport` returns a tiny `ipfs://<CID>` URI (~50 bytes) → `attest()` drops from 4.28M gas (data-URI, over Mantle's per-tx allowance) to ~116k gas → fits comfortably. Verified: real mainnet attestations broadcast + readback matches + IPFS gateway retrievable (txs `0xf3350990…` local-driven, `0x943b18e1…` via the deployed worker). The prior data-URI fallback (no IPFS) was the fragile path that exceeded the allowance — now only used if the Pinata JWT is missing. Persistence note: retrievability depends on Pinata staying alive; an Arweave backstop is a future roadmap item for true permanence.
- Worker is a Vercel **internal service** (reached via `WORKER_URL` binding); `conatus-api.rectorspace.com` does NOT resolve (no public DNS). The worker `/run-audit` 500 body holds the real error, but the Vercel Queue consumer (`/api/queues/run`) discards it and surfaces only generic `"worker returned 500"` — to debug, reproduce locally (local `AGENT_PRIVATE_KEY` IS the prod agent #115 wallet). The job's on-chain result is in the `anchorResult` field (txHash/explorerUrl/findingsURI/ipfsBackend), NOT top-level.
- Pinata JWT extraction: the API-key modal **masks** the JWT in the DOM (input `.value` returns asterisks, not the real token — it lives in React state). Get it via a real CDP `click_at_xy` on the "Copy All" button (synthetic `.click()` does NOT copy — clipboard needs real user activation), then `pbpaste`. Pinata shows the JWT **once**.
- Cold start ~30-40s on first audit after idle (`preflight.sh --warm` to pre-warm).
- Merging to `main` auto-deploys Vercel prod; container (Slither/Foundry) rebuild + deploy ~105s.

## Notes

- See `SPEC.md` (design), `PLAN.md` (build plan), `CORE.md` (shared core) for the audit-agent architecture.
- Deployed on Mantle mainnet (chain 5000). ERC-8004 agent registration #115.