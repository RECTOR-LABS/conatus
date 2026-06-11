# Conatus demo — silent walkthrough shot list

Target: **~2:45 final** (raw ~3:30, one speed-up edit) · no voice — the title cards narrate.
DoraHacks requires ≥2:00 — the plan lands comfortably above even after compression.

## Pre-recording checklist

1. Load the Vault fixture into the clipboard: `pbcopy < /tmp/vault.sol`
2. Chrome, one window, exactly **3 tabs** (use ⌘1/⌘2/⌘3 to switch):
   - **⌘1** `docs/demo/cards.html` (open the file, press `F` for fullscreen-element… or just keep the tab — the cards fill the viewport)
   - **⌘2** https://conatus.rectorspace.com (fresh load — staggered reveal plays)
   - **⌘3** https://mantlescan.xyz/tx/0xb7804b79e3bb239689c4b2428dafde152ab32f63c73563677e01bea8b00ddbaa (first MAINNET verdict)
3. Hide bookmarks bar (⌘⇧B) · 100 % zoom · close other windows. Keep the URL bar visible — the live domain IS the credibility.
4. macOS: Do Not Disturb ON · ⌘⇧5 → *Record Entire Screen* → **microphone OFF** → Start.

## Scenes (cards advance with → / space)

| # | Where | What happens | ~Raw |
|---|---|---|---|
| 1 | ⌘1 card 1–2 | TITLE (let the pulse breathe) → THE CLAIM | 0:00–0:16 |
| 2 | ⌘2 app | Scroll smoothly to the bottom **AgentCard**: identity #130 + the three reputation rows. Hold. | 0:16–0:30 |
| 3 | ⌘1 card 3 | EXHIBIT A — the audit | 0:30–0:37 |
| 4 | ⌘2 app | Scroll up · paste Vault (⌘V) · name `Vault` · anchor ON · **Run audit** · stage ticker runs (queued → slither → synthesis → anchoring) | 0:37–1:45 |
| 5 | ⌘1 card 4 | EXHIBIT B — the verdict (switch as the ticker completes) | 1:45–1:52 |
| 6 | ⌘2 app | Report: **87/100** · reentrancy escalated to CRITICAL · the AI-only `setOwner()` finding · the discarded-suggestions transparency note | 1:52–2:15 |
| 7 | ⌘1 card 5 | EXHIBIT C — the anchor | 2:15–2:22 |
| 8 | ⌘2 app | Click the **explorer tx link** in the report → MantleScan (Sepolia) tx page. Hold. | 2:22–2:32 |
| 9 | ⌘1 card 6 | EXHIBIT D — the reputation (the 90 · 85 · 88 plate) | 2:32–2:42 |
| 10 | ⌘3 | The **mainnet** verdict tx — real money rails. Hold. | 2:42–2:52 |
| 11 | ⌘1 card 7 | MAINNET close — agentId 115, addresses, links. Hold 5 s. Stop recording. | 2:52–3:05+ |

## The one edit

Scene 4's ticker wait (~45–60 s) → speed to **6–8×** in iMovie/CapCut (split clip at submit-click and at ticker-done, apply speed to the middle). Everything else stays real-time. Final ≈ 2:45.

## Notes

- Pre-flight verified today: full prod path returns riskScore 87 / 4 findings and anchors on-chain (job `6847bc72`, tx `0xc6af…7d4f`) — the flow will not surprise you mid-take.
- If the LLM returns a different riskScore than 87 during the take, that's fine — Policy A is honest non-determinism; cards don't hard-code the live score.
- Export 1080p+ MP4 → YouTube (unlisted is fine for DoraHacks) → link in the submission.

## Cowork mode (optional)

CIPHER can drive every browser action via Chrome MCP (smooth scrolls, paste, clicks, tab switches) while you only run the screen recorder — say the word and we rehearse once before the take.
