import OpenAI from "openai";
import { z } from "zod";
import { AuditReport, Severity, Confidence, SourceLocation, type Finding } from "./schema";
import { computeRiskScore } from "./scoring";

/** One triage operation. Flat (not a discriminated union) so the generated JSON Schema is simple
 *  for tool-calling; per-action required fields are enforced in applyTriage. */
export const TriageOp = z.object({
  action: z.enum(["reclassify", "dedup", "add"]),
  id: z.string().optional(),
  into: z.string().optional(),
  title: z.string().optional(),
  severity: Severity.optional(),
  confidence: Confidence.optional(),
  description: z.string().optional(),
  recommendation: z.string().optional(),
  location: SourceLocation.optional(),
  rationale: z.string().min(1),
});
export type TriageOp = z.infer<typeof TriageOp>;

export const SynthesisOutput = z.object({
  summary: z.string().min(1),
  operations: z.array(TriageOp),
});
export type SynthesisOutput = z.infer<typeof SynthesisOutput>;

/** Severity ordering for the dedup guard (higher = more severe). */
const SEVERITY_RANK: Record<z.infer<typeof Severity>, number> = {
  optimization: 0,
  informational: 1,
  low: 2,
  medium: 3,
  high: 4,
  critical: 5,
};

export interface ApplyResult {
  findings: Finding[];
  skipped: number;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "finding";
}

/**
 * Apply LLM triage operations to the deterministic findings. Pure + deterministic: the LLM can only
 * reclassify (severity change, original preserved in adjustedFrom), dedup (fold a finding into an
 * equal-or-higher-severity one), or add (source:"llm", line citation mandatory). Any op that violates
 * a guard is skipped and counted — never silently trusted.
 */
export function applyTriage(base: Finding[], output: SynthesisOutput): ApplyResult {
  const findings: Finding[] = base.map((f) => ({ ...f }));
  let skipped = 0;
  let added = 0;

  for (const op of output.operations) {
    if (op.action === "reclassify") {
      const idx = findings.findIndex((f) => f.id === op.id);
      const startLine = op.location?.startLine;
      if (idx === -1 || !op.severity || !startLine) {
        skipped++;
        continue;
      }
      const target = findings[idx]!;
      target.adjustedFrom = {
        severity: target.severity,
        ...(target.confidence ? { confidence: target.confidence } : {}),
        by: "llm",
        rationale: op.rationale,
      };
      target.severity = op.severity;
      if (op.confidence) target.confidence = op.confidence;
      target.location = op.location;
    } else if (op.action === "dedup") {
      const idx = findings.findIndex((f) => f.id === op.id);
      const intoIdx = findings.findIndex((f) => f.id === op.into);
      if (idx === -1 || intoIdx === -1 || op.id === op.into) {
        skipped++;
        continue;
      }
      if (SEVERITY_RANK[findings[intoIdx]!.severity] < SEVERITY_RANK[findings[idx]!.severity]) {
        skipped++;
        continue;
      }
      findings.splice(idx, 1);
    } else {
      const startLine = op.location?.startLine;
      if (!op.title || !op.severity || !op.description || !startLine) {
        skipped++;
        continue;
      }
      findings.push({
        id: `llm-${slug(op.title)}-${added++}`,
        title: op.title,
        severity: op.severity,
        ...(op.confidence ? { confidence: op.confidence } : {}),
        source: "llm",
        location: op.location,
        description: op.description,
        ...(op.recommendation ? { recommendation: op.recommendation } : {}),
      });
    }
  }

  return { findings, skipped };
}

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "anthropic/claude-sonnet-5";
const INCOMPLETE_PREFIX =
  "INCOMPLETE AUDIT — a required tool failed; the absence of issues here is NOT a pass. ";

const SYSTEM_PROMPT = `You are a senior smart-contract security auditor triaging automated tool output (Slither static analysis + a Mantle gas/DA heuristic) for a Solidity contract about to be deployed on Mantle.

Refine the findings — do NOT score them:
- merge findings describing the same root cause (dedup),
- correct a clearly mis-rated severity (reclassify),
- add a finding only when you can point to specific lines the tools missed (add).

Hard rules:
- You assign NO numeric risk score; a deterministic rubric computes it from your findings.
- Severities: critical, high, medium, low, informational, optimization. Slither never emits "critical" — escalate genuine criticals yourself.
- For every reclassify and add you MUST cite a line range (startLine, plus endLine when it spans lines). If you cannot cite a line, omit the operation.
- Be conservative and precise; reference the actual code in every rationale. Never invent issues.
- Reply with exactly one submit_triage tool call.`;

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export interface SynthesizeOptions {
  apiKey?: string;
  model?: string;
  baseURL?: string;
  client?: OpenAI;
  now?: () => Date;
}

function isPlaceholderKey(k: string | undefined): boolean {
  return !k || /^PLACEH/i.test(k) || k.length < 20;
}

function buildUserContent(base: AuditReport, source: string): string {
  const numbered = source.split("\n").map((l, i) => `${i + 1}  ${l}`).join("\n");
  return [
    "SOURCE (line-numbered):",
    "```solidity",
    numbered,
    "```",
    "",
    "DETERMINISTIC FINDINGS (JSON):",
    JSON.stringify(base.findings, null, 2),
    "",
    `GAS/DA NOTES: ${base.toolRuns.mantle_gas_review.notes ?? "(none)"}`,
    `TOOL STATUS: slither=${base.toolRuns.slither.status}, gas=${base.toolRuns.mantle_gas_review.status}.`,
    "",
    "Return one submit_triage tool call. Assign no score. Cite a startLine for every reclassify/add or omit it.",
  ].join("\n");
}

async function callWithRetry(client: OpenAI, model: string, messages: ChatMsg[]): Promise<SynthesisOutput> {
  const parameters = z.toJSONSchema(SynthesisOutput) as Record<string, unknown>;
  delete parameters.$schema; // OpenAI/Anthropic want a bare JSON Schema for function parameters
  const tools = [
    {
      type: "function" as const,
      function: {
        name: "submit_triage",
        description: "Submit the refined triage: a one-paragraph summary and operations over the findings.",
        parameters,
      },
    },
  ];

  const RETRY_NOTE =
    "\n\nIMPORTANT: your previous reply was rejected. Respond with ONLY the submit_triage tool call; cite a startLine for every reclassify/add.";

  for (let attempt = 0; attempt < 2; attempt++) {
    // Fold the retry nudge into the last user turn rather than appending a second consecutive
    // user message — keeps strict role alternation for the Anthropic-via-OpenRouter endpoint.
    const attemptMessages: ChatMsg[] =
      attempt === 0
        ? messages
        : messages.map((m, idx) => (idx === messages.length - 1 ? { ...m, content: m.content + RETRY_NOTE } : m));

    const completion = await client.chat.completions
      .create({
        model,
        temperature: 0,
        messages: attemptMessages,
        tools,
        tool_choice: { type: "function", function: { name: "submit_triage" } },
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`LLM call failed (model="${model}"): ${msg}. Check LLM_MODEL and connectivity.`);
      });

    const call = completion.choices[0]?.message?.tool_calls?.[0];
    const rawArgs =
      call?.type === "function" && call.function.name === "submit_triage" ? call.function.arguments : undefined;
    if (rawArgs) {
      let json: unknown = null;
      try {
        json = JSON.parse(rawArgs);
      } catch {
        json = null;
      }
      const parsed = SynthesisOutput.safeParse(json);
      if (parsed.success) return parsed.data;
    }

    if (attempt > 0) {
      throw new Error("LLM synthesis failed: no valid submit_triage payload after one retry.");
    }
  }
  throw new Error("LLM synthesis failed: exhausted retries.");
}

/**
 * Run one LLM synthesis pass over a deterministic AuditReport (Policy A). Refines findings via
 * applyTriage, recomputes riskScore deterministically (the LLM never sets it), latches incomplete,
 * and returns a schema-valid AuditReport. Throws (no silent fallback) on a missing/placeholder key
 * or an unrecoverable LLM failure.
 */
export async function synthesizeAudit(base: AuditReport, source: string, opts: SynthesizeOptions = {}): Promise<AuditReport> {
  const apiKey = opts.apiKey ?? process.env.LLM_API_KEY;
  if (isPlaceholderKey(apiKey)) {
    throw new Error("LLM_API_KEY missing or placeholder — set a real OpenRouter key in .env");
  }
  const model = opts.model ?? process.env.LLM_MODEL ?? DEFAULT_MODEL;
  const client = opts.client ?? new OpenAI({ apiKey, baseURL: opts.baseURL ?? DEFAULT_BASE_URL });
  const now = opts.now ?? (() => new Date());

  const messages: ChatMsg[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserContent(base, source) },
  ];
  const output = await callWithRetry(client, model, messages);

  const { findings, skipped } = applyTriage(base.findings, output);
  const riskScore = computeRiskScore(findings);
  let summary = output.summary.trim();
  if (base.incomplete) summary = INCOMPLETE_PREFIX + summary;
  if (skipped > 0) summary += ` (${skipped} AI suggestion(s) discarded for missing citations.)`;

  const report: AuditReport = {
    schemaVersion: "1",
    target: base.target,
    riskScore,
    summary,
    findings,
    toolRuns: base.toolRuns,
    model,
    incomplete: base.incomplete,
    createdAt: now().toISOString(),
  };
  return AuditReport.parse(report);
}
