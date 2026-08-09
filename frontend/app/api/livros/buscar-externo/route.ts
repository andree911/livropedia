import { NextRequest } from "next/server";
import { proxyPublic } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  return proxyPublic(`/livros/buscar-externo?q=${encodeURIComponent(q)}`);
}
