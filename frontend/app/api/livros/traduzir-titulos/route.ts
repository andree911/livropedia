import { NextRequest, NextResponse } from "next/server";
import { proxyAuthed } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    // Requisicao cancelada no meio (ex: efeito refeito em StrictMode) -
    // degrada pro mesmo formato que "sem traducao ainda", sem quebrar.
    return NextResponse.json({ titulos: {} });
  }

  return proxyAuthed("/livros/traduzir-titulos", { method: "POST", body });
}
