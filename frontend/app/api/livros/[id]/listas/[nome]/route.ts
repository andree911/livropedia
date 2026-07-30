import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/api-helpers";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; nome: string }> }
) {
  const { id, nome } = await params;
  return proxyAuthed(`/livros/${id}/listas/${encodeURIComponent(nome)}`, { method: "DELETE" });
}
