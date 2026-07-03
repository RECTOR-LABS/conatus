"use client";
import { useState } from "react";
import { ShieldX, ShieldCheck } from "lucide-react";
import { MAINNET, EIP_SELF_FEEDBACK_QUOTE } from "@/app/judges/_data";
import { shortAddr } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Result = null | { ok: false; msg: string } | { ok: true; rater: string };

export function SelfRatingSim() {
  const [result, setResult] = useState<Result>(null);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="mb-3 text-base text-slate-400">try to leave a rating on agent #{MAINNET.agentId}:</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setResult({ ok: false, msg: EIP_SELF_FEEDBACK_QUOTE })}
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-base text-red-200 hover:bg-red-500/20"
        >
          rate as the agent ({shortAddr(MAINNET.owner)})
        </button>
        <button
          onClick={() => setResult({ ok: true, rater: MAINNET.rater })}
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-base text-emerald-200 hover:bg-emerald-500/20"
        >
          rate as a third-party ({shortAddr(MAINNET.rater)})
        </button>
      </div>

      {result && (
        <div
          data-testid="sim-result"
          className={cn("mt-4 flex items-start gap-2 rounded-lg border p-3 text-base motion-safe:animate-[fadein_240ms_ease]",
            result.ok ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-200" : "border-red-500/40 bg-red-500/5 text-red-200")}
        >
          {result.ok ? <ShieldCheck className="mt-0.5 size-4 shrink-0" /> : <ShieldX className="mt-0.5 size-4 shrink-0" />}
          {result.ok ? (
            <span>tx accepted — <span className="font-mono">NewFeedback</span> emitted, rater <span className="font-mono">{shortAddr(result.rater)}</span> (not the agent). earned, not self-assigned.</span>
          ) : (
            <span><span className="font-mono uppercase">revert</span> — {result.msg}</span>
          )}
        </div>
      )}
    </div>
  );
}
