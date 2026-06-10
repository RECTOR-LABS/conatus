import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  const apiUrl = process.env.CONATUS_API_URL;
  const token = process.env.CONATUS_API_TOKEN;
  if (!apiUrl || !token) {
    return NextResponse.json({ error: "Server misconfigured: CONATUS_API_URL/CONATUS_API_TOKEN missing." }, { status: 500 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  const upstream = await fetch(`${apiUrl}/audits/${id}`, {
    headers: { "x-api-token": token },
    cache: "no-store",
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ error: "Audit service unreachable." }, { status: 502 });
  return NextResponse.json(await upstream.json().catch(() => ({ error: "Bad upstream response." })), { status: upstream.status });
}
