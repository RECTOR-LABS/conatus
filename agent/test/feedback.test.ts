import { describe, it, expect } from "vitest";
import { keccak256, toBytes } from "viem";
import { buildFeedbackPayload, encodeFeedbackUri, FEEDBACK_DIMENSIONS } from "../src/feedback";

const targetHash = ("0x" + "ab".repeat(32)) as `0x${string}`;

describe("feedback payload", () => {
  it("exposes the three audit-domain dimensions", () => {
    expect(FEEDBACK_DIMENSIONS).toEqual(["audit:accuracy", "audit:coverage", "audit:actionability"]);
  });

  it("builds a schema-stable payload", () => {
    const p = buildFeedbackPayload({
      agentId: 130,
      targetHash,
      attestationTx: "0xdead",
      riskScore: 87,
      dimension: "audit:accuracy",
      score: 95,
      comment: "caught the drain",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });
    expect(p).toEqual({
      schemaVersion: "1",
      kind: "audit-feedback",
      agentId: 130,
      targetHash,
      attestationTx: "0xdead",
      riskScore: 87,
      dimension: "audit:accuracy",
      score: 95,
      comment: "caught the drain",
      createdAt: "2026-06-10T00:00:00.000Z",
    });
  });

  it("encodes a data: URI that round-trips and a keccak hash of the exact JSON", () => {
    const p = buildFeedbackPayload({
      agentId: 130, targetHash, attestationTx: "0xdead", riskScore: 87,
      dimension: "audit:coverage", score: 80, now: () => new Date("2026-06-10T00:00:00.000Z"),
    });
    const { uri, hash } = encodeFeedbackUri(p);
    expect(uri).toMatch(/^data:application\/json;base64,/);
    const json = Buffer.from(uri.split(",")[1]!, "base64").toString("utf8");
    expect(JSON.parse(json)).toEqual(p);
    expect(hash).toBe(keccak256(toBytes(json)));
  });

  it("rejects an out-of-range score", () => {
    expect(() =>
      buildFeedbackPayload({ agentId: 130, targetHash, attestationTx: "0x1", riskScore: 1, dimension: "audit:accuracy", score: 101 }),
    ).toThrow(/0.*100/);
  });
});
