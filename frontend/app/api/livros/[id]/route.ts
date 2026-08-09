import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/api-helpers";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return proxyAuthed(`/livros/${id}`, { method: "PUT", body });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAuthed(`/livros/${id}`, { method: "DELETE" });
}
