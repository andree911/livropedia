import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/api-helpers";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAuthed(`/avaliacoes/${id}`, { method: "DELETE" });
}
