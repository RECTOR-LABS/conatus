import { keccak256, toBytes } from "viem";

/** Audit-domain reputation dimensions (tag1). The zero-prior-art differentiator: ERC-8004 feedback
 *  tagged by audit-quality dimension, with tag2 = the audited targetHash for per-contract queries. */
export const FEEDBACK_DIMENSIONS = ["audit:accuracy", "audit:coverage", "audit:actionability"] as const;
export type FeedbackDimension = (typeof FEEDBACK_DIMENSIONS)[number];

export interface FeedbackPayload {
  schemaVersion: "1";
  kind: "audit-feedback";
  agentId: number;
  targetHash: `0x${string}`;
  attestationTx: string;
  riskScore: number;
  dimension: FeedbackDimension;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface BuildFeedbackArgs {
  agentId: number;
  targetHash: `0x${string}`;
  attestationTx: string;
  riskScore: number;
  dimension: FeedbackDimension;
  score: number;
  comment?: string;
  now?: () => Date;
}

export function buildFeedbackPayload(args: BuildFeedbackArgs): FeedbackPayload {
  if (!Number.isInteger(args.score) || args.score < 0 || args.score > 100) {
    throw new Error(`score must be an integer 0–100, got ${args.score}`);
  }
  const now = args.now ?? (() => new Date());
  return {
    schemaVersion: "1",
    kind: "audit-feedback",
    agentId: args.agentId,
    targetHash: args.targetHash,
    attestationTx: args.attestationTx,
    riskScore: args.riskScore,
    dimension: args.dimension,
    score: args.score,
    ...(args.comment ? { comment: args.comment } : {}),
    createdAt: now().toISOString(),
  };
}

/** Always data: URI (deterministic, no external dependency, no secret) + keccak of the exact JSON
 *  — the on-chain feedbackHash binds the rating to this precise payload. */
export function encodeFeedbackUri(payload: FeedbackPayload): { uri: string; hash: `0x${string}` } {
  const json = JSON.stringify(payload);
  return {
    uri: `data:application/json;base64,${Buffer.from(json, "utf8").toString("base64")}`,
    hash: keccak256(toBytes(json)),
  };
}
