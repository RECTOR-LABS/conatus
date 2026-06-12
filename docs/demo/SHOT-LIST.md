# Conatus demo — silent walkthrough shot list (MAINNET)

**The live app is now on Mantle mainnet (agent 115).** The audit's own "view transaction" link
goes straight to `mantlescan.xyz` — so the mainnet proof is **inline**, no separate tab needed.
Just **2 tabs**, 3 context switches. Show first, explain after. No voice — the cards narrate.
Target: raw ~3:00 → **~2:30 final** after one speed-up edit. DoraHacks needs ≥2:00.

## Pre-recording checklist

1. Load the Vault fixture into the clipboard: `pbcopy < /tmp/vault.sol`
   (if missing: it's the vulnerable Vault — reentrancy + unprotected setOwner.)
2. **Fresh Chrome window**, exactly **2 tabs** (switch with ⌘1 / ⌘2):
   - **⌘1** the cards — `http://localhost:8077/cards.html` (server is running) — on **card 1**
   - **⌘2** the live app — `https://conatus.rectorspace.com` (fresh load — staggered reveal plays)
3. Hide bookmarks bar (⌘⇧B) · 100% zoom · no other windows. Keep the URL bar visible.
4. macOS: Do Not Disturb ON · ⌘⇧5 → *Record Entire Screen* → **microphone OFF** → Start.

## What changed vs the old (Sepolia) recording
- The app header now reads **AGENT #115**, the badge says **Mantle**, footer **Mantle (5000)**.
- Clicking **view transaction** opens **mantlescan.xyz** (mainnet) — real MNT fee, **no red "Testnet only" banner**. This is the payoff; linger on it.
- The reputation card (agent 115) already shows accuracy 90 / coverage 85 / actionability 88.
- ⚠️ Each anchored audit costs **~0.07 real MNT**. Do one clean take; a retry is another ~0.07 (fine).

## The four blocks

### Block 1 — setup · ⌘1 cards (0:00–0:22)
Card 1 TITLE (~8s, let the pulse breathe) → card 2 THE CLAIM (~8s) → card 3 EXHIBIT A (~7s).

### Block 2 — the real thing, one continuous take · ⌘2 app (0:22–2:15 raw)
| Beat | Action | ~Raw |
|---|---|---|
| Proof of the claim | Scroll to the **AgentCard** — "ERC-8004 agent #115 · Mantle" + the 3 ratings. **Hold 12s.** | 0:22–0:40 |
| Submit | Scroll up · click the source box · ⌘V · name `Vault` · keep **Anchor verdict on-chain** ✓ · **Run audit** | 0:40–0:55 |
| Ticker | queued → slither → synthesis → **anchoring on Mantle** (don't touch — this segment gets sped up) | 0:55–1:45 |
| Verdict | Scroll the report slowly: **87/100** · reentrancy **AI re-rated to CRITICAL** · the **HIGH `setOwner` (llm)** finding tools missed. **Linger ~25s.** | 1:45–2:05 |
| **Mainnet proof** | Click **view transaction** → **mantlescan.xyz** (mainnet, real MNT fee, no testnet banner). **Hold 10s.** | 2:05–2:15 |

### Block 3 — significance recap · ⌘1 cards (2:15–2:40)
Card 4 EXHIBIT B (~8s) → card 5 EXHIBIT C (~8s) → card 6 EXHIBIT D, the 90·85·88 plates (~9s).

### Block 4 — close · ⌘1 card 7 (2:40–2:55)
Card 7 MAINNET close (agent 115, addresses, links) — **hold 8s** → stop recording.

## The one edit
Block 2's ticker (~50s) → speed to **6–8×** in iMovie/CapCut: split at the *Run audit* click and at
ticker completion, speed the middle. Everything else real-time. Final ≈ 2:30 — **confirm ≥2:00**.

## After
- Replace the embedded video: drop the new MP4 at `web/public/conatus-demo.mp4` (CIPHER will convert + a new poster), then redeploy so `/pitch` shows the mainnet take.
- Upload to YouTube (unlisted is fine for DoraHacks) → link in the submission.

## Cowork mode (optional)
CIPHER can drive every browser action via Chrome MCP (paste, scrolls, clicks, the view-transaction
click, tab switches) while you only run the screen recorder. Say **"drive"** and we rehearse once first.
