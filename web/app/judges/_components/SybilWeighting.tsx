// web/app/judges/_components/SybilWeighting.tsx
"use client";
import { useState } from "react";
import { naiveReputation, weightedReputation } from "@/lib/judges";
import { SYBIL_DEMO } from "@/app/judges/_data";
import { cn } from "@/lib/utils";

export function SybilWeighting() {
  const [weighted, setWeighted] = useState(false);
  const score = weighted ? weightedReputation(SYBIL_DEMO) : naiveReputation(SYBIL_DEMO);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border border-slate-700 p-0.5 text-sm">
          <button
            onClick={() => setWeighted(false)}
            className={cn("rounded-md px-3 py-1.5", !weighted ? "bg-slate-700 text-white" : "text-slate-400")}
          >
            naive average
          </button>
          <button
            onClick={() => setWeighted(true)}
            className={cn("rounded-md px-3 py-1.5", weighted ? "bg-emerald-500/80 text-slate-950" : "text-slate-400")}
          >
            weight by reputation + proof
          </button>
        </div>
        <p data-testid="sybil-score" className="font-[family-name:var(--font-archivo)] text-4xl font-extrabold tabular-nums text-emerald-400">
          {score}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {SYBIL_DEMO.map((r, i) => {
          const muted = weighted && !r.proofOfConsumption;
          return (
            <span
              key={i}
              title={r.label}
              className={cn("h-6 rounded px-2 text-sm leading-6 transition-opacity",
                r.proofOfConsumption ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-700/60 text-slate-400",
                muted && "opacity-20")}
            >
              {r.value}
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {weighted
          ? "10 throwaway wallets have no standing + never consumed the audit → weight 0. only the real client counts."
          : "one real rating (90) drowned by 10 sybil wallets each screaming 100."}
      </p>
      <div className="mt-3 flex gap-2 text-[0.7rem]">
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-300">live: attribution + binding + filterable reads</span>
        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-300">roadmap: staking / proof-of-consumption weighting</span>
      </div>
    </div>
  );
}
