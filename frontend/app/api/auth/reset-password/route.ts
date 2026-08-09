import { NextRequest } from "next/server";
import { proxyPublic } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyPublic("/reset-password", { method: "POST", body });
}
