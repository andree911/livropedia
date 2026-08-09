import { NextResponse } from "next/server";
import { flaskFetch } from "@/lib/flask";
import { getToken } from "@/lib/session";

type ProxyInit = { method?: string; body?: unknown };

/** Repassa uma chamada pro Flask sem exigir autenticação. */
export async function proxyPublic(path: string, init: ProxyInit = {}) {
  const res = await flaskFetch(path, init);
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

/** Repassa uma chamada pro Flask anexando o token do cookie httpOnly como Bearer. */
export async function proxyAuthed(path: string, init: ProxyInit = {}) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  }

  const res = await flaskFetch(path, { ...init, token });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
