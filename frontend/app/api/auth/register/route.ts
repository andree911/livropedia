import { NextRequest, NextResponse } from "next/server";
import { flaskFetch } from "@/lib/flask";
import { setTokens } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await flaskFetch("/register", { method: "POST", body });
  const data = await res.json().catch(() => null);

  if (res.ok && data?.access_token) {
    await setTokens(data.access_token, data.refresh_token);
  }

  return NextResponse.json(data, { status: res.status });
}
