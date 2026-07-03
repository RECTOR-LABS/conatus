"use client";
import { useState } from "react";
import { rubricScore, SEVERITY_WEIGHT, type CalcFinding } from "@/lib/judges";
import { cn } from "@/lib/utils";

const PRESET: (CalcFinding & { on: boolean })[] = [
  { id: "reentrancy", label: "reentrancy in withdraw()", severity: "critical", confidence: "high", on: true },
  { id: "unchecked", label: "unchecked external call", severity: "high", confidence: "high", on: false },
  { id: "rounding", label: "rounding in share math", severity: "medium", confidence: "medium", on: false },
  { id: "gas", label: "storage write in loop", severity: "optimization", on: true },
];

export function RubricCalculator() {
  const [rows, setRows] = useState(PRESET);
  const active = rows.filter((r) => r.on);
  const score = rubricScore(active);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500">risk = min(100, round(Σ weight × confidence))</p>
        <p data-testid="rubric-score" className="font-[family-name:var(--font-archivo)] text-3xl font-extrabold tabular-nums text-emerald-400">
          {score}<span className="text-lg text-slate-600">/100</span>
        </p>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className={cn("font-mono text-xs", r.severity === "critical" ? "text-red-400" : r.severity === "high" ? "text-orange-400" : "text-slate-400")}>
                {r.severity}
              </span>
              <span className="text-slate-300">{r.label}</span>
              <span className="font-mono text-xs text-slate-600">+{SEVERITY_WEIGHT[r.severity]}</span>
            </span>
            <button
              role="switch"
              aria-checked={r.on}
              aria-label={`toggle ${r.label}`}
              onClick={() => setRows((prev) => prev.map((p) => (p.id === r.id ? { ...p, on: !p.on } : p)))}
              className={cn("h-5 w-9 rounded-full transition-colors", r.on ? "bg-emerald-500/80" : "bg-slate-700")}
            >
              <span className={cn("block size-4 rounded-full bg-white transition-transform", r.on ? "translate-x-4" : "translate-x-0.5")} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
