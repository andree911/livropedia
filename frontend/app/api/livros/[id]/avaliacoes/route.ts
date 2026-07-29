import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/api-helpers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return proxyAuthed(`/livros/${id}/avaliacoes`, { method: "POST", body });
}
