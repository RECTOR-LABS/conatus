"use client";
import { useState } from "react";
import { RotateCw } from "lucide-react";
import { runAudit } from "@/lib/judges";
import { cn } from "@/lib/utils";

export function RunItAgain() {
  const [run, setRun] = useState(0);
  const audit = runAudit(run);
  const history = Array.from({ length: run + 1 }, (_, i) => runAudit(i).score);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
            run <span data-testid="run-count" className="text-slate-300">#{run + 1}</span> · same contract
          </p>
          <p className="mt-1 text-sm text-slate-400">
            findings: <span className="tabular-nums text-slate-200">{audit.findingCount}</span>{" "}
            <span className="text-slate-600">(wobbles 2↔3)</span>
          </p>
        </div>
        <p data-testid="run-score" className="font-[family-name:var(--font-archivo)] text-5xl font-extrabold tabular-nums text-emerald-400">
          {audit.score}<span className="text-xl text-slate-600">/100</span>
        </p>
      </div>

      <ul className="mt-4 space-y-1.5" aria-label="findings this run">
        {audit.findings.map((f) => (
          <li key={f.id} className="flex items-center gap-2 text-sm motion-safe:animate-[fadein_240ms_ease]">
            <span className={cn("font-mono text-xs", f.severity === "critical" ? "text-red-400" : "text-slate-500")}>{f.severity}</span>
            <span className="text-slate-300">{f.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="truncate font-mono text-xs text-slate-500">
          {history.join(" · ")}
        </p>
        <button
          onClick={() => setRun((r) => r + 1)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          <RotateCw className="size-4" aria-hidden /> re-run audit
        </button>
      </div>
    </div>
  );
}
