import { NextResponse } from "next/server";
import { clearTokens } from "@/lib/session";

export async function POST() {
  await clearTokens();
  return NextResponse.json({ mensagem: "Logout realizado" });
}
