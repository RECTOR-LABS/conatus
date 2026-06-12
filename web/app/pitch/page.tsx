import type { Metadata } from "next";
import { ArrowUpRight, ShieldCheck, Fingerprint, Star, Cpu } from "lucide-react";
import { SITE_URL } from "@/lib/constants";

// Public on-chain record — verified addresses, safe to ship as page content.
const MAINNET = {
  explorer: "https://mantlescan.xyz",
  attestation: "0x94f22E008d0a8825850491170d97ba487Ed9E040",
  agentId: 115,
  identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  verdictTx: "0xb7804b79e3bb239689c4b2428dafde152ab32f63c73563677e01bea8b00ddbaa",
  registerTx: "0x0a81e87d822280bf5279845f135d001eb82f7bf3a298d82f66c4fd469d0b7158",
} as const;

const SEPOLIA = {
  explorer: "https://sepolia.mantlescan.xyz",
  attestation: "0x94f22E008d0a8825850491170d97ba487Ed9E040",
  agentId: 130,
  identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
} as const;

const GITHUB = "https://github.com/RECTOR-LABS/conatus";

export const metadata: Metadata = {
  title: "Conatus — pitch · the first audit agent native to Mantle's ERC-8004 stack",
  description:
    "Every Conatus verdict is an on-chain, identity-bound, reputation-accruing record. Live on Mantle mainnet. Mantle Turing Test Hackathon 2026.",
  openGraph: {
    title: "Conatus — on-chain AI audit agent for Mantle",
    description:
      "Slither × Mantle gas heuristics × LLM synthesis, every verdict anchored on-chain under an ERC-8004 identity that accrues audit-domain reputation. Live on mainnet.",
    url: `${SITE_URL}/pitch`,
    images: [{ url: `${SITE_URL}/conatus-demo-poster.jpg`, width: 1440, height: 1084 }],
    type: "website",
  },
};

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function ProofLink({
  href,
  label,
  value,
  emphasis = false,
}: {
  href: string;
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`group flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
        emphasis
          ? "border-primary/40 bg-primary/5 hover:border-primary/70 hover:bg-primary/10"
          : "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70"
      }`}
    >
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className={`truncate font-mono text-sm ${emphasis ? "text-primary" : "text-foreground/90"}`}>{value}</div>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
    </a>
  );
}

const CLAIMS = [
  {
    icon: ShieldCheck,
    head: "On-chain verdict",
    body: "Every audit is a transaction, not a PDF. The riskScore is recomputable from the IPFS-pinned findings — anyone can verify it.",
  },
  {
    icon: Fingerprint,
    head: "ERC-8004 identity",
    body: "The auditor is an on-chain agent (agentId), not an API key. Every verdict is bound to that portable identity — forever.",
  },
  {
    icon: Star,
    head: "Audit-domain reputation",
    body: "Third-party ratings across accuracy, coverage, and actionability. The registry blocks self-feedback on-chain — the scores are provably not ours.",
  },
];

export default function PitchPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
      {/* Status bar */}
      <div className="reveal flex items-center justify-between border-b border-border/60 pb-4">
        <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">CONATUS · FORENSIC RECORD</span>
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          <span className="status-dot inline-block size-2 rounded-full bg-primary" />
          LIVE ON MANTLE MAINNET
        </span>
      </div>

      {/* Hero */}
      <header className="reveal reveal-1 space-y-5 pt-10">
        <p className="section-tag">Mantle Turing Test Hackathon 2026 · AI DevTools</p>
        <h1 className="font-[family-name:var(--font-archivo)] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          The first audit agent native to <span className="text-primary">Mantle&apos;s ERC-8004 stack.</span>
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Conatus audits Solidity smart contracts — Slither static analysis, Mantle gas heuristics, and LLM synthesis —
          then anchors every verdict on-chain under a portable identity that accrues reputation. Not a report. A record.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={SITE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Launch the app <ArrowUpRight className="size-4" />
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border/70 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
          >
            Source on GitHub <ArrowUpRight className="size-4" />
          </a>
        </div>
      </header>

      {/* Video */}
      <section className="reveal reveal-2 pt-12">
        <p className="section-tag mb-3">01 / The walkthrough</p>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-2xl shadow-black/40">
          <video
            controls
            preload="metadata"
            poster="/conatus-demo-poster.jpg"
            className="aspect-[1440/1084] w-full bg-black"
          >
            <source src="/conatus-demo.mp4" type="video/mp4" />
            Your browser does not support the video tag — {""}
            <a href="/conatus-demo.mp4" className="text-primary underline">
              download the demo
            </a>
            .
          </video>
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
          Silent walkthrough · paste a vulnerable Vault → live AI audit → on-chain verdict → ERC-8004 reputation. The
          analysis segment is time-compressed.
        </p>
      </section>

      {/* The claim */}
      <section className="reveal reveal-3 pt-14">
        <p className="section-tag mb-5">02 / Why it&apos;s different</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {CLAIMS.map((c) => (
            <div key={c.head} className="rounded-xl border border-border/60 bg-card/40 p-5">
              <c.icon className="size-5 text-primary" />
              <h3 className="mt-3 font-[family-name:var(--font-archivo)] text-lg font-bold">{c.head}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verify it yourself */}
      <section className="pt-14">
        <p className="section-tag mb-2">03 / Verify it yourself</p>
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Don&apos;t trust the auditor — check the chain. Every claim below resolves on a public explorer.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProofLink
            href={`${MAINNET.explorer}/tx/${MAINNET.verdictTx}`}
            label="Mainnet · first AI verdict (real MNT)"
            value={`${short(MAINNET.verdictTx)} · riskScore 87`}
            emphasis
          />
          <ProofLink
            href={`${MAINNET.explorer}/address/${MAINNET.identityRegistry}`}
            label="Mainnet · ERC-8004 identity"
            value={`agentId ${MAINNET.agentId} · IdentityRegistry`}
            emphasis
          />
          <ProofLink href={SITE_URL} label="Live app · Mantle Sepolia" value="conatus.rectorspace.com" />
          <ProofLink href={GITHUB} label="Public source" value="github.com/RECTOR-LABS/conatus" />
          <ProofLink
            href={`${SEPOLIA.explorer}/address/${SEPOLIA.reputationRegistry}`}
            label="Sepolia · reputation registry"
            value={`agentId ${SEPOLIA.agentId} · 3 audit-domain ratings`}
          />
          <ProofLink
            href={`${SEPOLIA.explorer}/address/${SEPOLIA.attestation}`}
            label="Sepolia · AuditAttestation"
            value={short(SEPOLIA.attestation)}
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="pt-14">
        <p className="section-tag mb-5">04 / How it works</p>
        <div className="rounded-xl border border-border/60 bg-card/40 p-6">
          <div className="flex items-start gap-3">
            <Cpu className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <span className="font-mono text-foreground">Slither</span> static analysis +{" "}
                <span className="font-mono text-foreground">Mantle Arsia gas heuristics</span> produce a deterministic
                baseline. An <span className="font-mono text-foreground">LLM synthesis</span> pass (Policy A) then
                re-rates, deduplicates, and adds findings — but never emits the score itself, and every adjustment is
                recorded in <span className="font-mono text-foreground">adjustedFrom</span>. Suggestions without a line
                citation are discarded and counted.
              </p>
              <p>
                The final report is pinned, then{" "}
                <span className="font-mono text-foreground">AuditAttestation.attest()</span> writes the verdict on-chain
                under the agent&apos;s <span className="font-mono text-foreground">ERC-8004</span> identity. Third parties
                rate the audit via <span className="font-mono text-foreground">giveFeedback()</span> on the
                ReputationRegistry, tagged by quality dimension and the audited contract&apos;s hash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* On-chain record */}
      <section className="pt-14">
        <p className="section-tag mb-5">05 / On-chain record</p>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left font-mono text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-card/60 text-muted-foreground">
                <th className="px-4 py-3 font-medium"> </th>
                <th className="px-4 py-3 font-medium">Mantle Mainnet (5000)</th>
                <th className="px-4 py-3 font-medium">Mantle Sepolia (5003)</th>
              </tr>
            </thead>
            <tbody className="text-foreground/90">
              <tr className="border-b border-border/40">
                <td className="px-4 py-3 text-muted-foreground">AuditAttestation</td>
                <td className="px-4 py-3">{short(MAINNET.attestation)}</td>
                <td className="px-4 py-3">{short(SEPOLIA.attestation)}</td>
              </tr>
              <tr className="border-b border-border/40">
                <td className="px-4 py-3 text-muted-foreground">ERC-8004 agentId</td>
                <td className="px-4 py-3 text-primary">{MAINNET.agentId}</td>
                <td className="px-4 py-3 text-primary">{SEPOLIA.agentId}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-muted-foreground">ReputationRegistry</td>
                <td className="px-4 py-3">{short(MAINNET.reputationRegistry)}</td>
                <td className="px-4 py-3">{short(SEPOLIA.reputationRegistry)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-14 border-t border-border/60 pt-5">
        <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/70">
          First-pass triage, not a formal audit · single-file Solidity · AuditAttestation deploys to the same address on
          both chains (deterministic, nonce 0). Built for the Mantle Turing Test Hackathon 2026.
        </p>
      </footer>
    </main>
  );
}
