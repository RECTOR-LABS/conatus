"use client";
import { useState, useRef, type ReactNode, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface JudgeTab {
  id: string;
  judge: string;
  org: string;
  question: string;
  panel: ReactNode;
}

/** Accessible tab shell (WAI-ARIA tabs pattern): roles, aria-selected, roving tabindex,
 *  arrow/Home/End keyboard nav. One frame per judge so nobody has to scroll to find their answer. */
export function JudgesTabs({ tabs }: { tabs: JudgeTab[] }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    let next = active;
    if (e.key === "ArrowRight") next = (active + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (active - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="answers by judge"
        onKeyDown={onKeyDown}
        className="grid grid-cols-3 gap-2"
      >
        {tabs.map((t, i) => {
          const selected = active === i;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3",
                selected
                  ? "border-primary/50 bg-primary/10"
                  : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
              )}
            >
              <span
                className={cn(
                  "font-mono text-[9px] uppercase tracking-[0.16em] sm:text-[10px]",
                  selected ? "text-primary" : "text-slate-500"
                )}
              >
                {t.org}
              </span>
              <span className={cn("text-base font-semibold sm:text-lg", selected ? "text-slate-100" : "text-slate-300")}>
                {t.judge}
              </span>
              <span className="hidden text-sm leading-snug text-slate-500 sm:block">{t.question}</span>
            </button>
          );
        })}
      </div>

      {tabs.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={active !== i}
          tabIndex={0}
          className="pt-8 focus:outline-none"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
