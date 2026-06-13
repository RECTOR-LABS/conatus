import { keccak256, toBytes } from "viem";

// Mirrors agent/src/feedback.ts (source of truth) with a browser-safe base64 encoder.

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

export function buildFeedbackPayload(args: {
  agentId: number;
  targetHash: `0x${string}`;
  attestationTx: string;
  riskScore: number;
  dimension: FeedbackDimension;
  score: number;
  comment?: string;
  now?: () => Date;
}): FeedbackPayload {
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

/** Browser base64 of UTF-8 JSON + keccak of the exact JSON (binds feedbackHash to this payload). */
export function encodeFeedbackUri(payload: FeedbackPayload): { uri: string; hash: `0x${string}` } {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return { uri: `data:application/json;base64,${b64}`, hash: keccak256(toBytes(json)) };
}
