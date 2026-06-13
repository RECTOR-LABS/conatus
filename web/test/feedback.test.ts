import { describe, it, expect } from "vitest";
import { keccak256, toBytes } from "viem";
import { buildFeedbackPayload, encodeFeedbackUri } from "@/lib/feedback";

describe("browser feedback encoding", () => {
  it("data-URI round-trips and hash matches keccak of the exact JSON", () => {
    const p = buildFeedbackPayload({
      agentId: 130,
      targetHash: ("0x" + "ab".repeat(32)) as `0x${string}`,
      attestationTx: "0xdead",
      riskScore: 87,
      dimension: "audit:accuracy",
      score: 95,
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });
    const { uri, hash } = encodeFeedbackUri(p);
    const json = decodeURIComponent(escape(atob(uri.split(",")[1]!)));
    expect(JSON.parse(json)).toEqual(p);
    expect(hash).toBe(keccak256(toBytes(json)));
  });

  it("rejects an out-of-range score", () => {
    expect(() =>
      buildFeedbackPayload({
        agentId: 130,
        targetHash: ("0x" + "ab".repeat(32)) as `0x${string}`,
        attestationTx: "0x1",
        riskScore: 1,
        dimension: "audit:accuracy",
        score: -1,
      }),
    ).toThrow(/0.*100/);
  });
});
