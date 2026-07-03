import { FileCode, ScrollText, Link2, CheckCircle2 } from "lucide-react";
import { FOOTNOTES, type FootnoteType } from "@/app/judges/_data";
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

export function References() {
  return (
    <ol className="space-y-3 text-sm">
      {FOOTNOTES.map((f, i) => {
        const Icon = ICON[f.type];
        return (
          <li key={f.id} id={`ref-${f.id}`} className="scroll-mt-24 flex gap-3">
            <span className="shrink-0 font-mono text-slate-500">[{i + 1}]</span>
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
