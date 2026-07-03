"use client";
import { useState } from "react";
import { MAINNET, REPUTATION, RATED_TARGET } from "@/app/judges/_data";
import { shortAddr } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FIELDS: { key: string; value: string; explain: string }[] = [
  { key: "agentId", value: `#${MAINNET.agentId}`, explain: "which agent is being rated — the ERC-8004 identity token id." },
  { key: "value", value: REPUTATION.map((r) => r.value).join(" / "), explain: "the score per dimension (0–100), valueDecimals 0." },
  { key: "tag1", value: `${REPUTATION[0].dimension}…`, explain: "the audit-quality dimension this rating is about." },
  { key: "tag2", value: RATED_TARGET.slice(0, 12) + "…", explain: "the audited contract's targetHash — binds the rating to one specific audit, not the agent in general." },
  { key: "feedbackHash", value: "keccak(payload)", explain: "keccak256 of the exact feedback payload — tamper-evident, can't be swapped after the fact." },
];

export function RatingAnatomy() {
  const [sel, setSel] = useState(FIELDS[3].key); // default to tag2 (the interesting one)
  const active = FIELDS.find((f) => f.key === sel)!;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="mb-3 text-sm text-slate-400">
        a real on-chain rating for #{MAINNET.agentId}, from <span className="font-mono text-slate-300">{shortAddr(MAINNET.rater)}</span>:
      </p>
      <div className="mb-4 flex gap-4">
        {REPUTATION.map((r) => (
          <div key={r.dimension} className="flex flex-col">
            <span className="font-[family-name:var(--font-archivo)] text-2xl font-bold tabular-nums text-emerald-400">{r.value}</span>
            <span className="font-mono text-[0.7rem] text-slate-500">{r.dimension.replace("audit:", "")}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FIELDS.map((f) => (
          <button
            key={f.key}
            onClick={() => setSel(f.key)}
            className={cn("rounded-md border px-2 py-1 font-mono text-xs", sel === f.key ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200" : "border-slate-700 text-slate-400 hover:text-slate-200")}
          >
            {f.key}
          </button>
        ))}
      </div>
      <p data-testid="field-explainer" className="mt-3 text-sm text-slate-300">
        <span className="font-mono text-slate-500">{active.key}={active.value}</span> — {active.explain}
      </p>
    </div>
  );
}
