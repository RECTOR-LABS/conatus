import { describe, it, expect } from "vitest";
import { makeRateLimit } from "@/lib/rateLimit";

function fakeRedis() {
  const counts = new Map<string, number>();
  return {
    incr: async (k: string) => { const n = (counts.get(k) ?? 0) + 1; counts.set(k, n); return n; },
    expire: async () => 1 as const,
  };
}

describe("rateLimit", () => {
  it("allows the first 5 requests per IP and denies the 6th", async () => {
    const allow = makeRateLimit(fakeRedis() as never);
    const results: boolean[] = [];
    for (let i = 0; i < 6; i++) results.push(await allow("1.2.3.4"));
    expect(results).toEqual([true, true, true, true, true, false]);
  });

  it("tracks IPs independently", async () => {
    const allow = makeRateLimit(fakeRedis() as never);
    for (let i = 0; i < 5; i++) await allow("a");
    expect(await allow("a")).toBe(false);
    expect(await allow("b")).toBe(true);
  });
});
