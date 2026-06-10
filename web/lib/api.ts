import type { AuditJobResponse } from "./types";

async function jsonOrThrow(res: Response): Promise<unknown> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

export async function submitAudit(input: { source: string; contractName?: string; anchor: boolean }): Promise<{ id: string }> {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await jsonOrThrow(res)) as { id: string };
}

export async function getAudit(id: string): Promise<AuditJobResponse> {
  const res = await fetch(`/api/audit/${id}`);
  return (await jsonOrThrow(res)) as AuditJobResponse;
}
