import type { AuditReport, Finding, Severity } from "@/lib/types";
import type { AnchorResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ExternalLink, FileJson, Cpu } from "lucide-react";

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-400 border border-red-500/40",
  high: "bg-orange-500/15 text-orange-400 border border-orange-500/40",
  medium: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/40",
  low: "bg-blue-500/15 text-blue-300 border border-blue-500/40",
  informational: "bg-zinc-500/15 text-zinc-300 border border-zinc-500/40",
  optimization: "bg-primary/10 text-primary border border-primary/40",
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-red-400";
  if (score >= 40) return "text-orange-400";
  if (score >= 15) return "text-yellow-300";
  return "text-primary";
}

function lineRef(f: Finding): string | null {
  const s = f.location?.startLine;
  if (!s) return null;
  const e = f.location?.endLine;
  return e && e !== s ? `L${s}–${e}` : `L${s}`;
}

export function ReportView({ report, anchorResult }: { report: AuditReport; anchorResult?: AnchorResult }) {
  return (
    <section className="space-y-4 reveal">
      <p className="section-tag">02 / verdict</p>

      {report.incomplete && (
        <div className="flex items-center gap-3 border border-yellow-500/50 bg-yellow-500/10 p-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-300" />
          <p className="text-sm text-yellow-200">
            Incomplete audit — a required tool failed. The absence of findings is <span className="font-semibold">not</span> a pass.
          </p>
        </div>
      )}

      <Card className="relative overflow-hidden rounded-sm border-border/70">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="font-[family-name:var(--font-archivo)] text-lg tracking-tight">
              {report.target.contractName ?? "Contract"}
            </CardTitle>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{report.summary}</p>
            {report.model && (
              <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/80">
                <Cpu className="h-3.5 w-3.5" /> synthesis: {report.model}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className={`block font-[family-name:var(--font-archivo)] text-7xl font-extrabold leading-none tabular-nums ${scoreColor(report.riskScore)}`}>
              {report.riskScore}
            </span>
            <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">/100 RISK</span>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-sm border-border/70">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-archivo)] text-base">
            Findings <span className="font-mono text-sm text-muted-foreground">({report.findings.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.findings.length === 0 && (
            <p className="text-sm text-muted-foreground">No findings surfaced by static analysis or synthesis.</p>
          )}
          {report.findings.map((f) => (
            <article key={f.id} className="group border border-border/60 p-3 transition-colors hover:border-primary/50">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`rounded-sm font-mono text-[10px] uppercase tracking-wider ${SEVERITY_STYLE[f.severity]}`}>
                  {f.severity}
                </Badge>
                <span className="font-medium">{f.title}</span>
                {lineRef(f) && <span className="font-mono text-xs text-primary/80">{lineRef(f)}</span>}
                <Badge variant="outline" className="rounded-sm font-mono text-[10px] text-muted-foreground">
                  {f.source}
                </Badge>
                {f.adjustedFrom && (
                  <Badge
                    variant="secondary"
                    className="rounded-sm font-mono text-[10px]"
                    title={f.adjustedFrom.rationale}
                  >
                    AI re-rated from {f.adjustedFrom.severity}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              {f.recommendation && (
                <p className="mt-1.5 text-sm"><span className="font-semibold text-primary/90">Fix:</span> {f.recommendation}</p>
              )}
            </article>
          ))}
        </CardContent>
      </Card>

      {anchorResult && (
        <Card className="rounded-sm border-primary/30 bg-primary/[0.04]">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-archivo)] text-base">On-chain verdict</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <a
              className="inline-flex items-center gap-1.5 text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              href={anchorResult.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" /> view transaction
            </a>
            <p className="break-all font-mono text-[11px] text-muted-foreground">targetHash {report.target.targetHash}</p>
            <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <FileJson className="h-3.5 w-3.5" /> findings pinned via {anchorResult.ipfsBackend}
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
