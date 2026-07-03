import { FileCode, ScrollText, Link2, CheckCircle2 } from "lucide-react";
import { FOOTNOTES, footnoteIndex, type FootnoteType } from "@/app/judges/_data";
import { cn } from "@/lib/utils";

const ICON: Record<FootnoteType, typeof FileCode> = {
  eip: ScrollText,
  source: FileCode,
  chain: Link2,
  test: CheckCircle2,
};
const TYPE_LABEL: Record<FootnoteType, string> = {
  eip: "spec", source: "source", chain: "on-chain", test: "ci test",
};

/** The receipts rail. Pass `ids` to show only a subset (a per-tab strip); numbers stay global
 *  (footnoteIndex) so they always match the inline [n] markers regardless of which subset renders. */
export function References({ ids }: { ids?: string[] } = {}) {
  const items = ids ? FOOTNOTES.filter((f) => ids.includes(f.id)) : FOOTNOTES;
  return (
    <ol className="space-y-3 text-base">
      {items.map((f) => {
        const Icon = ICON[f.type];
        return (
          <li key={f.id} id={`ref-${f.id}`} className="scroll-mt-24 flex gap-3">
            <span className="shrink-0 font-mono text-slate-500">[{footnoteIndex(f.id)}]</span>
            <span className="flex min-w-0 flex-col gap-1">
              <a
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1.5 text-slate-200 hover:text-emerald-300"
              >
                <Icon className="mt-0.5 size-3.5 shrink-0 text-emerald-400" aria-hidden />
                <span className="break-words">{f.label}</span>
              </a>
              <span className={cn("font-mono text-[0.7rem] uppercase tracking-wide text-slate-500")}>
                {TYPE_LABEL[f.type]}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
