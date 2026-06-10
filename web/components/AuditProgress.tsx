import type { JobStatus } from "@/lib/types";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

const STAGES: { key: JobStatus; label: string }[] = [
  { key: "queued", label: "Queued" },
  { key: "slither", label: "Static analysis — Slither" },
  { key: "synthesis", label: "AI synthesis — LLM triage" },
  { key: "anchoring", label: "Anchoring on Mantle Sepolia" },
];
const ORDER: JobStatus[] = ["queued", "slither", "synthesis", "anchoring", "done"];

export function AuditProgress({ status, anchor }: { status: JobStatus; anchor: boolean }) {
  const idx = ORDER.indexOf(status);
  const stages = anchor ? STAGES : STAGES.slice(0, 3);
  return (
    <div className="reveal border border-border/60 bg-card/40 p-4">
      <p className="section-tag mb-3">running</p>
      <ol className="space-y-2.5" aria-label="Audit progress">
        {stages.map((s, i) => {
          const done = idx > i || status === "done";
          const active = idx === i;
          return (
            <li key={s.key} className="flex items-center gap-2.5 font-mono text-[13px]">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
              <span className={done ? "text-muted-foreground" : active ? "text-foreground" : "text-muted-foreground/50"}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
