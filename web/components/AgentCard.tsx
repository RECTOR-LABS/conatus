"use client";

import { useEffect, useState } from "react";
import { publicClient } from "@/lib/wallet";
import { identityRegistryAbi, reputationRegistryAbi } from "@/lib/abis";
import { AGENT_ID, CHAIN_NAME, IDENTITY_REGISTRY, REPUTATION_REGISTRY, explorerAddress } from "@/lib/constants";
import { aggregateFeedback, type DimensionAggregate } from "@/lib/aggregate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Fingerprint } from "lucide-react";

interface AgentInfo {
  name?: string;
  description?: string;
  owner?: string;
}

export function AgentCard() {
  const [info, setInfo] = useState<AgentInfo>({});
  const [reputation, setReputation] = useState<DimensionAggregate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [uri, owner, feedback] = await Promise.all([
          publicClient.readContract({ address: IDENTITY_REGISTRY, abi: identityRegistryAbi, functionName: "tokenURI", args: [AGENT_ID] }),
          publicClient.readContract({ address: IDENTITY_REGISTRY, abi: identityRegistryAbi, functionName: "ownerOf", args: [AGENT_ID] }),
          publicClient.readContract({ address: REPUTATION_REGISTRY, abi: reputationRegistryAbi, functionName: "readAllFeedback", args: [AGENT_ID, [], "", "", false] }),
        ]);
        if (cancelled) return;
        let parsed: AgentInfo = {};
        if (uri.startsWith("data:application/json;base64,")) {
          try {
            const json = JSON.parse(decodeURIComponent(escape(atob(uri.split(",")[1]!)))) as Record<string, string>;
            parsed = { name: json.name, description: json.description };
          } catch {
            parsed = {};
          }
        }
        setInfo({ ...parsed, owner });
        const [, , values, valueDecimals, tag1s, , revokedStatuses] = feedback;
        setReputation(
          aggregateFeedback({
            values,
            valueDecimals: [...valueDecimals],
            tag1s: [...tag1s],
            revokedStatuses: [...revokedStatuses],
          }),
        );
      } catch (e) {
        if (!cancelled) setError(`Could not load agent identity: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="reveal reveal-3 space-y-4">
      <p className="section-tag">03 / agent</p>
      <Card className="rounded-sm border-border/70">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-archivo)] text-base">
            <Fingerprint className="h-4 w-4 text-primary" />
            ERC-8004 agent #{AGENT_ID.toString()}
            <Badge variant="outline" className="rounded-sm font-mono text-[10px]">{CHAIN_NAME}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {error && <p className="text-red-400">{error}</p>}
          {info.name && <p className="font-medium">{info.name}</p>}
          {info.description && <p className="leading-relaxed text-muted-foreground">{info.description}</p>}
          {info.owner && (
            <a
              className="inline-flex items-center gap-1.5 font-mono text-xs text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              href={explorerAddress(info.owner)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" /> agent wallet {info.owner.slice(0, 6)}…{info.owner.slice(-4)}
            </a>
          )}
          <div className="border-t border-border/50 pt-3">
            <p className="mb-2 font-[family-name:var(--font-archivo)] font-semibold">Audit-domain reputation</p>
            {reputation === null && !error && <p className="text-muted-foreground">Loading on-chain reputation…</p>}
            {reputation?.length === 0 && (
              <p className="text-muted-foreground">No ratings yet — run an audit and be the first to rate it.</p>
            )}
            {reputation?.map((r) => (
              <div key={r.dimension} className="flex items-center justify-between border-b border-border/40 py-1.5">
                <span className="font-mono text-xs text-primary/90">{r.dimension}</span>
                <span className="font-mono text-xs tabular-nums">
                  {r.average}<span className="text-muted-foreground">/100 · {r.count} rating(s)</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Every verdict accrues to this on-chain identity. Ratings are provably third-party — the registry rejects
            self-feedback from the agent&apos;s own wallet.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
