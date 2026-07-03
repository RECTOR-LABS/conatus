// web/app/judges/_components/BoxedPipeline.tsx
import { Boxes, Bot, Calculator, Link2 } from "lucide-react";
import { triageGuard, runAudit, type TriageOp } from "@/lib/judges";

const OPS: (TriageOp & { label: string })[] = [
  { action: "reclassify", hasCitation: true, label: "reentrancy high→critical (cites L42)" },
  { action: "add", hasCitation: false, label: "'maybe an overflow?' (no line cited)" },
];

// Hoisted to module scope (not nested in BoxedPipeline): a component declared inside
// another component's render body is recreated every render, which resets its internal
// state and trips eslint-plugin-react-hooks' static-components rule.
function Stage({ icon: Icon, name, sub }: { icon: typeof Boxes; name: string; sub: string }) {
  return (
    <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center">
      <Icon className="mx-auto size-4 text-emerald-400" aria-hidden />
      <p className="mt-1 text-xs font-semibold text-slate-200">{name}</p>
      <p className="text-[0.65rem] text-slate-500">{sub}</p>
    </div>
  );
}

export function BoxedPipeline() {
  const audit = runAudit(0);
  const judged = OPS.map((o) => ({ ...o, verdict: triageGuard(o) }));
  const dropped = judged.filter((o) => o.verdict === "dropped").length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
      <div className="flex items-stretch gap-2">
        <Stage icon={Boxes} name="Slither" sub="deterministic floor" />
        <Stage icon={Bot} name="LLM triage" sub="temp 0 · must cite" />
        <Stage icon={Calculator} name="rubric" sub="pure function" />
        <Stage icon={Link2} name="on-chain" sub="immutable" />
      </div>
      <ul className="mt-4 space-y-1.5 text-sm">
        {judged.map((o, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className={o.verdict === "dropped" ? "font-mono text-xs text-red-400 line-through" : "font-mono text-xs text-emerald-400"}>
              {o.verdict}
            </span>
            <span className={o.verdict === "dropped" ? "text-slate-500 line-through" : "text-slate-300"}>{o.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span><span data-testid="dropped-count" className="text-red-400">{dropped}</span> AI suggestion(s) discarded for missing citations</span>
        <span>final score <span data-testid="pipeline-score" className="font-mono text-emerald-400">{audit.score}</span></span>
      </p>
    </div>
  );
}
