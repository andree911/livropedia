import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyAuthed("/livros", { method: "POST", body });
}
