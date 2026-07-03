import { footnoteIndex } from "@/app/judges/_data";

// Inline citation marker. Plain anchor (no client JS needed) — jumps to the references rail.
export function Footnote({ id }: { id: string }) {
  const n = footnoteIndex(id);
  return (
    <a
      href={`#ref-${id}`}
      aria-label={`Reference ${n}`}
      className="ml-0.5 align-super text-[0.62em] font-semibold text-emerald-400 hover:text-emerald-300 no-underline"
    >
      [{n}]
    </a>
  );
}
