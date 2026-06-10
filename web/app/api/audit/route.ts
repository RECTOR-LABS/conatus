import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiUrl = process.env.CONATUS_API_URL;
  const token = process.env.CONATUS_API_TOKEN;
  if (!apiUrl || !token) {
    return NextResponse.json({ error: "Server misconfigured: CONATUS_API_URL/CONATUS_API_TOKEN missing." }, { status: 500 });
  }
  const body = await req.text();
  const upstream = await fetch(`${apiUrl}/audits`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-token": token },
    body,
    cache: "no-store",
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ error: "Audit service unreachable." }, { status: 502 });
  return NextResponse.json(await upstream.json().catch(() => ({ error: "Bad upstream response." })), { status: upstream.status });
}
