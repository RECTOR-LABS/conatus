import { keccak256, toBytes } from "viem";

const PINATA_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export interface PinResult {
  /** The URI stored on-chain in AuditAttestation.findingsURI. */
  uri: string;
  /** keccak256 of the canonical JSON — usable as an integrity hash (e.g. reputation feedbackHash). */
  hash: `0x${string}`;
  backend: "pinata" | "data-uri";
}

export interface PinOptions {
  jwt?: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  name?: string;
}

/**
 * Pin a JSON audit report for on-chain reference.
 * - With a Pinata JWT (IPFS_PINNING_JWT): pins to IPFS, returns an `ipfs://<cid>` URI (cheap calldata).
 * - Without one: falls back to a self-contained `data:application/json;base64,...` URI. This costs
 *   more L1 DA on Mantle but keeps the verdict fully verifiable with zero external dependency —
 *   a deliberate, documented degradation rather than a silent failure.
 */
export async function pinReport(report: unknown, opts: PinOptions = {}): Promise<PinResult> {
  const json = JSON.stringify(report);
  const hash = keccak256(toBytes(json));
  const jwt = opts.jwt ?? process.env.IPFS_PINNING_JWT;

  if (jwt) {
    const doFetch = opts.fetchImpl ?? fetch;
    const res = await doFetch(PINATA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({
        pinataContent: report,
        pinataMetadata: { name: opts.name ?? "conatus-audit-report" },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Pinata pin failed: ${res.status} ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { IpfsHash?: string };
    if (!data.IpfsHash) throw new Error("Pinata response missing IpfsHash");
    return { uri: `ipfs://${data.IpfsHash}`, hash, backend: "pinata" };
  }

  const b64 = Buffer.from(json, "utf8").toString("base64");
  return { uri: `data:application/json;base64,${b64}`, hash, backend: "data-uri" };
}
