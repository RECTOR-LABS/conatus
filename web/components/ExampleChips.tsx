"use client";

import { EXAMPLES, type Example } from "@/lib/examples";
import { cn } from "@/lib/utils";

const SEVERITY_CLASS: Record<Example["severity"], string> = {
  high: "text-red-400",
  med: "text-amber-400",
  low: "text-primary",
};

export function ExampleChips({ onLoad }: { onLoad: (ex: Example) => void }) {
  return (
    <>
      <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">TRY AN EXAMPLE</span>
      {EXAMPLES.map((ex) => (
        <button
          key={ex.id}
          type="button"
          onClick={() => onLoad(ex)}
          aria-label={`Load ${ex.name} example (${ex.descriptor})`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 font-mono text-[11px]",
            "text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          )}
        >
          {ex.name} · <span className={SEVERITY_CLASS[ex.severity]}>{ex.descriptor}</span>
        </button>
      ))}
    </>
  );
}
