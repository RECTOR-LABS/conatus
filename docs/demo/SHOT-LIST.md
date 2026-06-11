# Conatus demo — silent walkthrough shot list

**4 blocks, 3 context switches.** Show first, explain after. No voice — the cards narrate.
Target: raw ~3:05 → **~2:30 final** after the one speed-up edit. DoraHacks requires ≥2:00 — verify the final cut length before upload.

## Pre-recording checklist

1. Load the Vault fixture into the clipboard: `pbcopy < /tmp/vault.sol`
2. **Fresh Chrome window**, exactly **3 tabs** (⌘1/⌘2/⌘3):
   - **⌘1** `docs/demo/cards.html` (or http://localhost:8077/cards.html) — on **card 1**
   - **⌘2** https://conatus.rectorspace.com (fresh load — staggered reveal plays)
   - **⌘3** https://mantlescan.xyz/tx/0xb7804b79e3bb239689c4b2428dafde152ab32f63c73563677e01bea8b00ddbaa (first MAINNET verdict)
3. Hide bookmarks bar (⌘⇧B) · 100 % zoom · no other windows. Keep the URL bar visible — the live domain IS the credibility.
4. macOS: Do Not Disturb ON · ⌘⇧5 → *Record Entire Screen* → **microphone OFF** → Start.

## The four blocks

### Block 1 — setup · ⌘1 cards (0:00–0:22)
Card 1 TITLE (~8 s, let the pulse breathe) → card 2 THE CLAIM (~8 s) → card 3 EXHIBIT A (~7 s).

### Block 2 — the real thing, one continuous take · ⌘2 app (0:22–2:20 raw)
| Beat | Action | ~Raw |
|---|---|---|
| Proof of the claim | Scroll smoothly to the bottom **AgentCard** — identity #130 + the three reputation rows. **Hold 12 s.** | 0:22–0:40 |
| Submit | Scroll up · click source field · ⌘V · name `Vault` · anchor ON · **Run audit** | 0:40–0:55 |
| Ticker | queued → slither → synthesis → anchoring (don't touch anything — this segment gets sped up) | 0:55–1:50 |
| Verdict | Scroll the report slowly: **87/100** · reentrancy escalated to CRITICAL · the AI-only `setOwner()` finding · the discarded-suggestions note. **Linger ~30 s.** | 1:50–2:10 |
| On-chain | Click the **explorer tx link** → MantleScan (Sepolia). **Hold 10 s.** | 2:10–2:20 |

### Block 3 — significance recap · ⌘1 cards (2:20–2:45)
Card 4 EXHIBIT B (~8 s) → card 5 EXHIBIT C (~8 s) → card 6 EXHIBIT D, the 90 · 85 · 88 plates (~9 s).

### Block 4 — real money rails · ⌘3 then ⌘1 (2:45–3:05)
Mainnet verdict tx — **hold 10 s** → ⌘1 card 7 MAINNET close — **hold 8 s** → stop recording.

## The one edit

Block 2's ticker (~55 s) → speed to **6–8×** in iMovie/CapCut: split at *Run audit* click and at ticker completion, apply speed to the middle. Everything else stays real-time. Final ≈ 2:30 — **confirm it's ≥2:00**.

## Notes

- Pre-flight verified (2026-06-12): full prod path returns riskScore 87 / 4 findings and anchors on-chain in ~30 s (job `6847bc72`, tx `0xc6af…7d4f`). A failed take costs nothing — Sepolia gas is free; just re-run.
- If the live riskScore differs from 87, that's Policy A's honest non-determinism — the cards don't hard-code the live score.
- Why no in-card simulation: Conatus's thesis is *verify, don't trust* — the live domain, real ticker, and resolving explorer links are the proof a simulation can't give.
- Export 1080p+ MP4 → YouTube (unlisted is fine for DoraHacks) → link in the submission.

## Cowork mode (optional)

CIPHER can drive every browser action via Chrome MCP while you record — but a human trackpad scroll reads more organic on camera; automated input looks robotic. Recommended: you drive with this list on a phone/second display, CIPHER on standby.
