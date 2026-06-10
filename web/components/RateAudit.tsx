"use client";

import { useState } from "react";
import { connectWallet } from "@/lib/wallet";
import { buildFeedbackPayload, encodeFeedbackUri, FEEDBACK_DIMENSIONS, type FeedbackDimension } from "@/lib/feedback";
import { reputationRegistryAbi } from "@/lib/abis";
import { AGENT_ID, REPUTATION_REGISTRY, SITE_URL, explorerTx, mantleSepolia } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExternalLink, Star } from "lucide-react";

export interface RateAuditProps {
  targetHash: `0x${string}`;
  attestationTx: string;
  riskScore: number;
}

export function RateAudit({ targetHash, attestationTx, riskScore }: RateAuditProps) {
  const [dimension, setDimension] = useState<FeedbackDimension>("audit:accuracy");
  const [score, setScore] = useState(90);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const { client, address } = await connectWallet();
      const payload = buildFeedbackPayload({
        agentId: Number(AGENT_ID),
        targetHash,
        attestationTx,
        riskScore,
        dimension,
        score,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      const { uri, hash } = encodeFeedbackUri(payload);
      const sent = await client.writeContract({
        address: REPUTATION_REGISTRY,
        abi: reputationRegistryAbi,
        functionName: "giveFeedback",
        args: [AGENT_ID, BigInt(score), 0, dimension, targetHash, SITE_URL, uri, hash],
        account: address,
        chain: mantleSepolia,
      });
      setTxHash(sent);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        /self-feedback/i.test(msg)
          ? "This wallet owns the agent — the registry forbids self-feedback. Connect a different wallet."
          : /rejected/i.test(msg)
            ? "Signature rejected in the wallet."
            : `Feedback failed: ${msg}`,
      );
    } finally {
      setBusy(false);
    }
  }

  if (txHash) {
    return (
      <Card className="rounded-sm border-primary/40 bg-primary/[0.05]">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-archivo)] text-base">Rating anchored — shukran</CardTitle>
        </CardHeader>
        <CardContent>
          <a
            className="inline-flex items-center gap-1.5 text-sm text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
            href={explorerTx(txHash)}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4" /> view feedback transaction
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-sm border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-archivo)] text-base">
          <Star className="h-4 w-4 text-primary" /> Rate this audit
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">ERC-8004 reputation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value as FeedbackDimension)}
            className="rounded-sm border border-input bg-card/60 px-2 py-1.5 font-mono text-xs"
            aria-label="Rating dimension"
          >
            {FEEDBACK_DIMENSIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 font-mono text-xs">
            score
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="accent-[oklch(0.88_0.13_172)]"
            />
            <span className="w-8 tabular-nums text-primary">{score}</span>
          </label>
        </div>
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment (pinned into the on-chain feedback record)"
          className="rounded-sm border-border/70 bg-card/60 text-sm"
        />
        <Button onClick={submit} disabled={busy} className="rounded-sm font-semibold">
          {busy ? "Waiting for wallet…" : "Connect wallet & sign rating"}
        </Button>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
          signs giveFeedback · tag1 {dimension} · tag2 = this audit&apos;s targetHash
        </p>
      </CardContent>
    </Card>
  );
}
