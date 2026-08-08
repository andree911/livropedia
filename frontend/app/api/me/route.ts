import { NextRequest, NextResponse } from "next/server";
import { flaskFetch } from "@/lib/flask";
import { clearTokens, getToken } from "@/lib/session";
import { proxyAuthed } from "@/lib/api-helpers";

export async function GET() {
  return proxyAuthed("/me");
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return proxyAuthed("/me", { method: "PATCH", body });
}

export async function DELETE(request: NextRequest) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const res = await flaskFetch("/me", { method: "DELETE", token, body });
  const data = await res.json().catch(() => null);

  if (res.ok) {
    await clearTokens();
  }

  return NextResponse.json(data, { status: res.status });
}
