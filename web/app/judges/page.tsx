import type { Metadata } from "next";
import { ArrowUpRight, HelpCircle, Users, Handshake } from "lucide-react";
import { SITE_URL, explorerAddress, shortAddr } from "@/lib/constants";
import { MAINNET } from "@/app/judges/_data";
import { Footnote } from "@/app/judges/_components/Footnote";
import { References } from "@/app/judges/_components/References";
import { SelfRatingSim } from "@/app/judges/_components/SelfRatingSim";
import { RatingAnatomy } from "@/app/judges/_components/RatingAnatomy";
import { SybilWeighting } from "@/app/judges/_components/SybilWeighting";
import { RunItAgain } from "@/app/judges/_components/RunItAgain";
import { RubricCalculator } from "@/app/judges/_components/RubricCalculator";
import { BoxedPipeline } from "@/app/judges/_components/BoxedPipeline";

const GITHUB = "https://github.com/RECTOR-LABS/conatus";

export const metadata: Metadata = {
  title: "Conatus — answers for the judges",
  description:
    "Two hard Demo-Day questions — can the reputation be gamed, and is the verdict reproducible — answered with interactive demos and on-chain receipts, not just talk.",
  openGraph: {
    title: "Conatus — answers for the judges",
    description:
      "Self-rating blocked at the contract level, ratings bound + tamper-evident, and a deterministic rubric the LLM never touches. Live on Mantle mainnet.",
    url: `${SITE_URL}/judges`,
    images: [{ url: `${SITE_URL}/conatus-demo-poster.jpg`, width: 1440, height: 1084 }],
    type: "website",
  },
};

// Reuses pitch's ProofLink idiom verbatim (semantic tokens render dark regardless — .dark is
// always on), just with the stricter noopener rel already used by References.tsx.
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
      rel="noopener noreferrer"
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
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
    </a>
  );
}

const REPUTATION_LAYERS: { status: "live" | "roadmap"; name: string; body: string }[] = [
  {
    status: "live",
    name: "self-rejection",
    body: "the registry itself reverts if the rater is the agent's own owner or operator — enforced in the contract, not a UI checkbox.",
  },
  {
    status: "live",
    name: "attribution + binding",
    body: "every rating carries the rater's address plus a targetHash tying it to one specific audit, and a feedbackHash so it can't be swapped after the fact.",
  },
  {
    status: "live",
    name: "filterable reads",
    body: "anyone can pull ratings straight off the registry, filtered by client address or tag — no middleman decides what you get to see.",
  },
  {
    status: "roadmap",
    name: "economic sybil-resistance",
    body: "stopping one person from spinning up 10 wallets needs a stake or proof-of-consumption gate. not built yet — that's genuinely next.",
  },
];

export default function JudgesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:py-20">
      {/* Status bar */}
      <div className="reveal flex items-center justify-between border-b border-border/60 pb-4">
        <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">CONATUS · FOR THE JUDGES</span>
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          <span className="status-dot inline-block size-2 rounded-full bg-primary" />
          LIVE ON MANTLE MAINNET
        </span>
      </div>

      {/* Hero */}
      <header className="reveal reveal-1 space-y-5 pt-10">
        <p className="section-tag">Mantle Turing Test Hackathon 2026 · Demo Day</p>
        <h1 className="font-[family-name:var(--font-archivo)] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
          answers for the judges.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          quick context — at demo day we got two questions that actually matter: can the reputation be gamed, and
          is the verdict even reproducible. fair questions, honestly kind of the whole ballgame. a slide
          wasn&apos;t going to cut it, so here&apos;s the real answer to both — live interactive demos, real code,
          on-chain receipts.
        </p>
        <p className="flex max-w-2xl items-start gap-2 text-sm leading-relaxed text-slate-400">
          <Users className="mt-0.5 size-4 shrink-0 text-emerald-400/80" aria-hidden />
          <span>
            thanks to <span className="text-slate-200">William</span> (Orbit AI),{" "}
            <span className="text-slate-200">Vizta Tsang</span> (Tencent Cloud), and{" "}
            <span className="text-slate-200">Whisker Yu</span> (Mantle) for asking them — this page exists because
            you didn&apos;t let it slide.
          </span>
        </p>
      </header>

      {/* Framing */}
      <section className="reveal reveal-2 pt-12">
        <p className="section-tag mb-3">00 / why these two questions</p>
        <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
          <HelpCircle className="mt-0.5 size-5 shrink-0 text-emerald-400" aria-hidden />
          <p className="text-sm leading-relaxed text-slate-300">
            if the reputation score can be faked, it isn&apos;t reputation — it&apos;s just a number I picked
            myself. and if the verdict changes every run, the risk score is basically vibes with extra steps. so:
            can the reputation be gamed, and is the verdict actually reproducible. both get a real answer below —
            working demos, not just paragraphs.
          </p>
        </div>
      </section>

      {/* Section A — reputation */}
      <section className="pt-14">
        <p className="section-tag mb-2">01 / reputation</p>
        <h2
          id="reputation"
          className="scroll-mt-24 font-[family-name:var(--font-archivo)] text-2xl font-bold tracking-tight sm:text-3xl"
        >
          can the reputation be gamed?
        </h2>

        <p className="mb-2 mt-5 font-mono text-xs uppercase tracking-widest text-emerald-400/80">tl;dr</p>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
          real talk — self-rating just can&apos;t happen, the ERC-8004 registry rejects it at the contract
          level<Footnote id="eip-self" /> (the agent&apos;s own wallet literally can&apos;t rate itself, it&apos;s
          in the spec<Footnote id="src-give" />). fake ratings from randoms? every rating is signed
          on-chain<Footnote id="chain-rep" /> and tied to one specific audit<Footnote id="src-feedback" />, so you
          can see who said what and weight it. the part we haven&apos;t fully solved — one person spinning up 10
          wallets — that&apos;s the next layer (make you stake / prove you actually used the audit first). being
          upfront.
        </p>

        <p className="mt-5 max-w-2xl border-l-2 border-emerald-500/30 pl-4 text-sm italic leading-relaxed text-slate-400">
          basically: you can&apos;t grade your own exam. a teacher grading their own test could hand out a 100,
          sure — nobody&apos;s trusting that grade. same idea here: the agent&apos;s owner
          wallet<Footnote id="chain-owner" /> is public record, and the contract flat-out refuses to let that
          address be the rater. don&apos;t take my word for it — try it below.
        </p>

        <p className="mb-2 mt-8 font-mono text-xs uppercase tracking-widest text-slate-500">
          try it — rate the agent as itself
        </p>
        <SelfRatingSim />

        <p className="mb-2 mt-6 font-mono text-xs uppercase tracking-widest text-slate-500">
          anatomy of a real on-chain rating
        </p>
        <RatingAnatomy />

        <p className="mb-2 mt-6 font-mono text-xs uppercase tracking-widest text-slate-500">
          naive average vs. weighted by reputation
        </p>
        <SybilWeighting />

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-slate-500">
            four layers, and where we&apos;re honestly at
          </p>
          <ol className="space-y-3 text-sm">
            {REPUTATION_LAYERS.map((l) => (
              <li key={l.name} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span
                  className={
                    l.status === "live"
                      ? "rounded bg-emerald-500/10 px-2 py-0.5 text-[0.7rem] text-emerald-300"
                      : "rounded bg-amber-500/10 px-2 py-0.5 text-[0.7rem] text-amber-300"
                  }
                >
                  {l.status}
                </span>
                <span className="font-semibold text-slate-200">{l.name}</span>
                <span className="text-slate-400">— {l.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Section B — determinism */}
      <section className="pt-14">
        <p className="section-tag mb-2">02 / determinism</p>
        <h2
          id="determinism"
          className="scroll-mt-24 font-[family-name:var(--font-archivo)] text-2xl font-bold tracking-tight sm:text-3xl"
        >
          is the verdict reproducible?
        </h2>

        <p className="mb-2 mt-5 font-mono text-xs uppercase tracking-widest text-emerald-400/80">tl;dr</p>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
          so honestly — yeah the LLM is probabilistic, we don&apos;t fight that. we just don&apos;t let it near
          the score<Footnote id="src-scoring" />. the model only argues about findings, a fixed rubric does the
          actual math<Footnote id="test-60" />. same findings, same number, every run. we ran the demo contract a
          bunch of times, kept landing on 60<Footnote id="chain-verdict" />. every time.
        </p>

        <p className="mt-5 max-w-2xl border-l-2 border-emerald-500/30 pl-4 text-sm italic leading-relaxed text-slate-400">
          referee vs. scoreboard, basically. the ref — the LLM, running at temperature
          0<Footnote id="src-temp0" /> — gets to argue about what happened on the field, is this a foul, is
          that not. but nothing it says counts unless it points at an actual line of code — anything uncited
          gets thrown out, and counted<Footnote id="src-guard" />. the scoreboard — the rubric — doesn&apos;t have
          opinions, it just adds up whatever findings survive review. same findings in, same score out.
        </p>

        <p className="mb-2 mt-8 font-mono text-xs uppercase tracking-widest text-slate-500">
          same contract, run it again
        </p>
        <RunItAgain />

        <p className="mb-2 mt-6 font-mono text-xs uppercase tracking-widest text-slate-500">the rubric, live</p>
        <RubricCalculator />

        <p className="mb-2 mt-6 font-mono text-xs uppercase tracking-widest text-slate-500">
          the whole pipeline, boxed in
        </p>
        <BoxedPipeline />

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-slate-400">
          one nuance, being straight about it: temp 0 doesn&apos;t mean the LLM writes the literal same words
          every single time — there&apos;s still some run-to-run wiggle in the prose (batching / floating-point
          stuff on the provider&apos;s side, not something we control). what&apos;s actually pinned down is the
          score, not the essay. the rubric only reads structured fields — severity, confidence, whether a citation
          exists — so as long as the same findings keep showing up, which they did every time we tried, the number
          holds. that&apos;s the whole point of boxing the LLM in like this: we&apos;re not trusting its writing,
          we&apos;re trusting whatever survives the guardrails.
        </p>
      </section>

      {/* References */}
      <section className="pt-14">
        <h2
          id="references"
          className="scroll-mt-24 font-[family-name:var(--font-archivo)] text-2xl font-bold tracking-tight sm:text-3xl"
        >
          references
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          every claim above, backed by a receipt: the EIP itself, the exact source lines, the on-chain
          transactions, and the CI test that pins the numbers.
        </p>
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
          <References />
        </div>

        <p className="mb-2 mt-8 font-mono text-xs uppercase tracking-widest text-slate-500">reproduce it yourself</p>
        <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-xs leading-relaxed text-slate-300">
{`// pull every rating for agent #${MAINNET.agentId} straight off the ReputationRegistry
readAllFeedback(
  agentId: ${MAINNET.agentId},   // this agent
  clientAddresses: [],           // empty = every rater, no filter
  tag1: "",                      // empty = every dimension
  tag2: "",                      // empty = every audited contract
  includeRevoked: true,
)
// ReputationRegistry: ${MAINNET.reputationRegistry} (Mantle mainnet)

// or just run the same test suite CI runs on every commit
git clone ${GITHUB}
cd conatus && pnpm -C agent test`}
        </pre>
      </section>

      {/* Close */}
      <section className="mt-14 border-t border-border/60 pt-8">
        <p className="section-tag mb-3">03 / go check it</p>
        <h2 className="font-[family-name:var(--font-archivo)] text-2xl font-bold tracking-tight sm:text-3xl">
          go check it yourself
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          the contract, the agent #115, the ratings, every anchored verdict — it&apos;s all live on Mantle
          mainnet right now, not a testnet stand-in. here&apos;s where to look:
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ProofLink href={SITE_URL} label="Live app · Mantle mainnet" value="conatus.rectorspace.com" emphasis />
          <ProofLink
            href={explorerAddress(MAINNET.attestation)}
            label="AuditAttestation contract"
            value={shortAddr(MAINNET.attestation)}
          />
          <ProofLink href={GITHUB} label="Public source" value="github.com/RECTOR-LABS/conatus" />
          <ProofLink
            href={explorerAddress(MAINNET.identityRegistry)}
            label="ERC-8004 identity"
            value={`agent #${MAINNET.agentId} · IdentityRegistry`}
          />
        </div>
        <p className="mt-8 flex items-start gap-2 text-sm leading-relaxed text-slate-400">
          <Handshake className="mt-0.5 size-4 shrink-0 text-emerald-400/80" aria-hidden />
          <span>genuinely — thanks for asking the hard questions. made the whole thing better. — RECTOR</span>
        </p>
      </section>
    </main>
  );
}
