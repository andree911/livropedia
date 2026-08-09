import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/api-helpers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  return proxyAuthed(`/livros/${id}/upload_capa`, { method: "POST", body: formData });
}
