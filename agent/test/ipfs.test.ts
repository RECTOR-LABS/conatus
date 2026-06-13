import { describe, it, expect, vi } from "vitest";
import { pinReport } from "../src/ipfs";

describe("pinReport", () => {
  it("falls back to a self-contained data: URI when no JWT is set", async () => {
    const res = await pinReport({ hello: "world" }, { jwt: undefined });
    expect(res.backend).toBe("data-uri");
    expect(res.uri.startsWith("data:application/json;base64,")).toBe(true);
    expect(res.hash).toMatch(/^0x[0-9a-f]{64}$/);
    const b64 = res.uri.split(",")[1]!;
    expect(JSON.parse(Buffer.from(b64, "base64").toString("utf8"))).toEqual({ hello: "world" });
  });

  it("pins to Pinata when a JWT + fetch are provided", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ IpfsHash: "bafyTestCid" }), { status: 200 }),
    ) as unknown as typeof fetch;
    const res = await pinReport({ a: 1 }, { jwt: "test-jwt", fetchImpl });
    expect(res.backend).toBe("pinata");
    expect(res.uri).toBe("ipfs://bafyTestCid");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("throws on a Pinata error (no silent failure)", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("unauthorized", { status: 401 }),
    ) as unknown as typeof fetch;
    await expect(pinReport({ a: 1 }, { jwt: "bad", fetchImpl })).rejects.toThrow(/Pinata pin failed/);
  });
});
