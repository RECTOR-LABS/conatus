"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { EXAMPLES, type Example } from "@/lib/examples";
import { copyToClipboard, cn } from "@/lib/utils";

const SEVERITY_CLASS: Record<Example["severity"], string> = {
  high: "text-red-400",
  med: "text-amber-400",
  low: "text-primary",
};

export function ExampleChips({ onPick }: { onPick?: (ex: Example) => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function handleCopy(ex: Example): Promise<void> {
    const ok = await copyToClipboard(ex.source);
    if (!ok) {
      setFailed(true);
      return;
    }
    setFailed(false);
    setCopiedId(ex.id);
    onPick?.(ex);
    window.setTimeout(() => {
      setCopiedId((current) => (current === ex.id ? null : current));
    }, 1600);
  }

  return (
    <>
      <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">TRY AN EXAMPLE</span>
      {EXAMPLES.map((ex) => {
        const copied = copiedId === ex.id;
        return (
          <button
            key={ex.id}
            type="button"
            onClick={() => void handleCopy(ex)}
            aria-label={`Copy ${ex.name} example (${ex.descriptor})`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
              copied
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:border-primary/60"
            )}
          >
            {copied ? (
              <>
                <Check className="size-3" />
                {ex.name} · copied
              </>
            ) : (
              <>
                {ex.name} · <span className={SEVERITY_CLASS[ex.severity]}>{ex.descriptor}</span>
              </>
            )}
          </button>
        );
      })}
      <span aria-live="polite" className="sr-only">
        {copiedId ? "Copied to clipboard — paste into the box above" : ""}
      </span>
      {failed && (
        <span className="font-mono text-[11px] text-red-400">
          Couldn’t copy — select the text and copy manually.
        </span>
      )}
    </>
  );
}
