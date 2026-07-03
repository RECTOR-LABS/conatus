import type { Metadata } from "next";
import { ArrowUpRight, Handshake } from "lucide-react";
import { SITE_URL, shortAddr } from "@/lib/constants";
import { MAINNET } from "@/app/judges/_data";
import { Footnote } from "@/app/judges/_components/Footnote";
import { References } from "@/app/judges/_components/References";
import { JudgesTabs, type JudgeTab } from "@/app/judges/_components/JudgesTabs";
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
    "Three Demo-Day questions, one tab each: how self/fake ratings are stopped, how the third-party mechanism works, and why the verdict is reproducible — interactive demos + on-chain receipts.",
  openGraph: {
    title: "Conatus — answers for the judges",
    description:
      "Self-rating blocked at the contract level, ratings bound + tamper-evident, and a deterministic rubric the LLM never touches. Live on Mantle mainnet.",
    url: `${SITE_URL}/judges`,
    images: [{ url: `${SITE_URL}/conatus-demo-poster.jpg`, width: 1440, height: 1084 }],
    type: "website",
  },
};

// Reuses pitch's ProofLink idiom (semantic tokens render dark regardless), with the stricter
// noopener rel already used by References.tsx.
function ProofLink({ href, label, value, emphasis = false }: { href: string; label: string; value: string; emphasis?: boolean }) {
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
        <div className={`truncate font-mono text-base ${emphasis ? "text-primary" : "text-foreground/90"}`}>{value}</div>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
    </a>
  );
}

function WidgetLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-6 font-mono text-sm uppercase tracking-widest text-slate-500">{children}</p>;
}

function Receipts({ ids }: { ids: string[] }) {
  return (
    <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="mb-3 font-mono text-[0.7rem] uppercase tracking-widest text-slate-500">receipts</p>
      <References ids={ids} />
    </div>
  );
}

// William's tab — the sybil plan, given real estate. "live" is shipped; "next" is honestly not-yet-built.
const SYBIL_PLAN: { tag: "live" | "next"; title: string; body: string }[] = [
  {
    tag: "live",
    title: "attribution + binding",
    body: "every rating is signed on-chain and tied to one specific audit — so fakes are at least attributable and weightable, never anonymous. (the mechanism itself is in Vizta's tab.)",
  },
  {
    tag: "next",
    title: "proof-of-consumption",
    body: "only a wallet that actually paid for an audit can rate it — provable on-chain. spinning up 10 wallets is useless unless each one really bought an audit: real money, real trail. the strongest and simplest filter, so it's first.",
  },
  {
    tag: "next",
    title: "staking",
    body: "to leave a rating you post a bond in MNT — slashable if the rating is later shown false. weight = stake × your own reputation. makes faking cost more than it's ever worth.",
  },
];

const williamPanel = (
  <>
    <h2 className="font-[family-name:var(--font-archivo)] text-3xl font-bold tracking-tight sm:text-4xl">
      how do you stop self-rating and fake ratings?
    </h2>
    <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
      real talk — the base case is closed. self-rating just can&apos;t happen: the ERC-8004 registry rejects it at
      the contract level<Footnote id="eip-self" /> — the agent&apos;s own wallet literally can&apos;t rate
      itself<Footnote id="src-give" />, and its owner address is public record<Footnote id="chain-owner" /> so
      there&apos;s no hiding behind it. you can&apos;t grade your own exam. try it:
    </p>
    <WidgetLabel>try it — rate the agent as itself</WidgetLabel>
    <SelfRatingSim />

    <p className="mt-8 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
      the harder question — and the one I think you&apos;re actually asking — is fakes from a bunch of fresh
      wallets. being straight: that&apos;s the part we&apos;re still building. here&apos;s the plan, in order:
    </p>
    <ol className="mt-4 space-y-3">
      {SYBIL_PLAN.map((s) => (
        <li key={s.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="mb-1 flex items-center gap-2">
            <span
              className={
                s.tag === "live"
                  ? "rounded bg-emerald-500/10 px-2 py-0.5 text-[0.7rem] text-emerald-300"
                  : "rounded bg-amber-500/10 px-2 py-0.5 text-[0.7rem] text-amber-300"
              }
            >
              {s.tag === "live" ? "live" : "next"}
            </span>
            <span className="font-semibold text-slate-200">{s.title}</span>
          </p>
          <p className="text-base leading-relaxed text-slate-400">{s.body}</p>
        </li>
      ))}
    </ol>
    <p className="mt-4 max-w-2xl text-base italic leading-relaxed text-slate-400">
      self-rejection is live today; the economic layer is the build. that&apos;s the honest state — but it&apos;s
      exactly the direction you were pointing at.
    </p>
    <Receipts ids={["eip-self", "src-give", "chain-owner"]} />
  </>
);

const viztaPanel = (
  <>
    <h2 className="font-[family-name:var(--font-archivo)] text-3xl font-bold tracking-tight sm:text-4xl">
      how does the third-party rating mechanism work?
    </h2>
    <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
      you flagged the same thing as William, and you&apos;re right that they&apos;re linked. so here&apos;s the
      actual mechanism — how one real rating works end to end, and why you can trust what you read off-chain.
    </p>
    <WidgetLabel>anatomy of a real on-chain rating</WidgetLabel>
    <RatingAnatomy />

    <p className="mt-8 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
      two things make it a mechanism and not a vibe: every rating is signed on-chain<Footnote id="chain-rep" /> and
      bound to one exact audit through a keccak feedbackHash<Footnote id="src-feedback" /> — so it can&apos;t be
      swapped after the fact; and anyone can read them straight off the registry, filtered by rater or tag, with no
      middleman deciding what you see.
    </p>

    <WidgetLabel>and how you handle fakes today — weight, don&apos;t average</WidgetLabel>
    <SybilWeighting />
    <p className="mt-4 max-w-2xl text-base italic leading-relaxed text-slate-400">
      a raw average is easy to drown with junk wallets. weight each rating by the rater&apos;s standing and the
      swarm collapses to near-zero — no gatekeeper needed.
    </p>
    <Receipts ids={["chain-rep", "src-feedback"]} />
  </>
);

const whiskerPanel = (
  <>
    <h2 className="font-[family-name:var(--font-archivo)] text-3xl font-bold tracking-tight sm:text-4xl">
      score the same contract twice — same result?
    </h2>
    <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
      so honestly — yeah the LLM is probabilistic, we don&apos;t fight that. we just don&apos;t let it near the
      score<Footnote id="src-scoring" />. the model only argues about findings, a fixed rubric does the actual
      math<Footnote id="test-60" />. same findings, same number, every run. we ran the demo contract a bunch of
      times, kept landing on 60<Footnote id="chain-verdict" />. every time.
    </p>
    <p className="mt-5 max-w-2xl border-l-2 border-emerald-500/30 pl-4 text-base italic leading-relaxed text-slate-400">
      referee vs. scoreboard, basically. the ref — the LLM, running at temperature 0<Footnote id="src-temp0" /> —
      gets to argue about what happened on the field. but nothing it says counts unless it points at an actual line
      of code — anything uncited gets thrown out, and counted<Footnote id="src-guard" />. the scoreboard — the
      rubric — doesn&apos;t have opinions, it just adds up whatever findings survive. same findings in, same score
      out.
    </p>
    <WidgetLabel>same contract, run it again</WidgetLabel>
    <RunItAgain />
    <WidgetLabel>the rubric, live — compute it yourself</WidgetLabel>
    <RubricCalculator />
    <WidgetLabel>the whole pipeline, boxed in</WidgetLabel>
    <BoxedPipeline />
    <p className="mt-8 max-w-2xl text-base leading-relaxed text-slate-400">
      one nuance, being straight: temp 0 doesn&apos;t mean the LLM writes the literal same words every time —
      there&apos;s still run-to-run wiggle in the prose (batching / floating-point on the provider&apos;s side, not
      something we control). what&apos;s pinned down is the score, not the essay. the rubric only reads structured
      fields — severity, confidence, whether a citation exists — so as long as the same findings keep showing up,
      which they did every time, the number holds. that&apos;s the whole point of boxing the LLM in: we&apos;re not
      trusting its writing, we&apos;re trusting whatever survives the guardrails.
    </p>
    <Receipts ids={["src-scoring", "test-60", "chain-verdict", "src-temp0", "src-guard"]} />
  </>
);

const TABS: JudgeTab[] = [
  { id: "william", judge: "William", org: "Orbit AI", question: "stopping self / fake ratings", panel: williamPanel },
  { id: "vizta", judge: "Vizta Tsang", org: "Tencent Cloud", question: "the third-party mechanism", panel: viztaPanel },
  { id: "whisker", judge: "Whisker Yu", org: "Mantle", question: "is the verdict reproducible?", panel: whiskerPanel },
];

export default function JudgesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:py-14">
      {/* Status bar */}
      <div className="reveal flex items-center justify-between border-b border-border/60 pb-4">
        <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">CONATUS · FOR THE JUDGES</span>
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          <span className="status-dot inline-block size-2 rounded-full bg-primary" />
          LIVE ON MANTLE MAINNET
        </span>
      </div>

      {/* Hero (tight — the tabs carry the framing) */}
      <header className="reveal reveal-1 space-y-4 pt-8">
        <p className="section-tag">Mantle Turing Test Hackathon 2026 · Demo Day</p>
        <h1 className="font-[family-name:var(--font-archivo)] text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          answers for the judges.
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
          demo day, three questions that actually matter. a slide wasn&apos;t going to cut it — so here&apos;s a
          real answer to each, one tab per judge. live interactive demos, real code, on-chain receipts. pick yours:
        </p>
      </header>

      {/* Tabs — one frame per judge */}
      <div className="reveal reveal-2 pt-8">
        <JudgesTabs tabs={TABS} />
      </div>

      {/* Shared footer — go verify + reproduce */}
      <section className="mt-14 border-t border-border/60 pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-[family-name:var(--font-archivo)] text-2xl font-bold tracking-tight">go check it yourself</h2>
          <p className="text-base text-slate-400">the contract, agent #{MAINNET.agentId}, the ratings, every verdict — all live on Mantle mainnet.</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ProofLink href={SITE_URL} label="Live app · Mantle mainnet" value="conatus.rectorspace.com" emphasis />
          <ProofLink
            href={`${MAINNET.explorer}/address/${MAINNET.attestation}`}
            label="AuditAttestation contract"
            value={shortAddr(MAINNET.attestation)}
          />
          <ProofLink href={GITHUB} label="Public source" value="github.com/RECTOR-LABS/conatus" />
          <ProofLink
            href={`${MAINNET.explorer}/address/${MAINNET.identityRegistry}`}
            label="ERC-8004 identity"
            value={`agent #${MAINNET.agentId} · IdentityRegistry`}
          />
        </div>

        <details className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <summary className="cursor-pointer font-mono text-[0.7rem] uppercase tracking-widest text-slate-500 hover:text-slate-300">
            reproduce it yourself
          </summary>
          <pre className="mt-3 overflow-x-auto font-mono text-sm leading-relaxed text-slate-300">
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
        </details>

        <p className="mt-8 flex items-start gap-2 text-base leading-relaxed text-slate-400">
          <Handshake className="mt-0.5 size-4 shrink-0 text-emerald-400/80" aria-hidden />
          <span>genuinely — thanks for asking the hard questions. made the whole thing better. — RECTOR</span>
        </p>
      </section>
    </main>
  );
}
