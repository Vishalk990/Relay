import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/config";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const jar = await cookies();

  const res = await fetch(`${BACKEND_URL}/api/workspaces/${id}`, {
    method: "DELETE",
    headers: { cookie: jar.toString() },
    cache: "no-store",
  });

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const body = await res.text();
  return new NextResponse(body || null, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "text/plain" },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const jar = await cookies();

  const res = await fetch(`${BACKEND_URL}/api/workspaces/${id}`, {
    method: "PATCH",
    headers: { cookie: jar.toString(), "content-type": "application/json" },
    body: await req.text(),
    cache: "no-store",
  });

  const body = await res.text();
  return new NextResponse(body || null, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "text/plain" },
  });
}
