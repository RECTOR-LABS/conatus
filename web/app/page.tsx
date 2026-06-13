"use client";

import { useState } from "react";
import { submitAudit } from "@/lib/api";
import { useAuditJob } from "@/hooks/useAuditJob";
import { SourceForm } from "@/components/SourceForm";
import { AuditProgress } from "@/components/AuditProgress";
import { ReportView } from "@/components/ReportView";
import { AgentCard } from "@/components/AgentCard";
import { RateAudit } from "@/components/RateAudit";
import { AGENT_ID, CHAIN_NAME, CHAIN_LABEL, ATTESTATION_ADDR, IDENTITY_REGISTRY, shortAddr } from "@/lib/constants";

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [anchor, setAnchor] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { job, error: pollError } = useAuditJob(jobId);

  const running = !!jobId && (!job || !["done", "error"].includes(job.status));
  const report = job?.status === "done" ? job.report : undefined;

  async function handleSubmit(input: { source: string; contractName: string; anchor: boolean }): Promise<void> {
    setSubmitError(null);
    setJobId(null);
    setAnchor(input.anchor);
    try {
      const { id } = await submitAudit(input);
      setJobId(id);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-6 py-10">
      <header className="reveal space-y-3 border-b border-border/60 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-archivo)] text-3xl font-extrabold tracking-tight">
            CONATUS
          </h1>
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
            <span className="status-dot inline-block h-2 w-2 rounded-full bg-primary" />
            AGENT #{AGENT_ID.toString()} ONLINE
          </span>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Autonomous AI audit agent for Mantle. Slither static analysis + Arsia-aware gas review + LLM triage —
          every verdict anchored on-chain under a portable ERC-8004 identity that accrues reputation.
        </p>
        <p className="font-mono text-[11px] text-muted-foreground/70">
          first-pass triage, not a formal audit · single-file Solidity · {CHAIN_NAME}
        </p>
      </header>

      <SourceForm onSubmit={handleSubmit} disabled={running} />
      {submitError && <p className="text-sm text-red-400">{submitError}</p>}

      {running && job && <AuditProgress status={job.status} anchor={anchor} />}
      {pollError && <p className="text-sm text-red-400">{pollError}</p>}
      {job?.status === "error" && (
        <p className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">Audit failed: {job.error}</p>
      )}

      {report && <ReportView report={report} anchorResult={job?.anchorResult} />}
      {report && job?.anchorResult && !report.incomplete && (
        <RateAudit
          targetHash={report.target.targetHash as `0x${string}`}
          attestationTx={job.anchorResult.txHash}
          riskScore={report.riskScore}
        />
      )}

      <AgentCard />

      <footer className="reveal reveal-4 border-t border-border/60 pt-4 pb-2">
        <p className="font-mono text-[11px] text-muted-foreground/70">
          AuditAttestation {shortAddr(ATTESTATION_ADDR)} · ERC-8004 IdentityRegistry {shortAddr(IDENTITY_REGISTRY)} · {CHAIN_LABEL}
        </p>
      </footer>
    </main>
  );
}
