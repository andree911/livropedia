import "server-only";
import { cookies } from "next/headers";
import { flaskFetch } from "@/lib/flask";
import type { Usuario } from "@/lib/types";

const COOKIE_NAME = "token";
// Flask (flask-jwt-extended) emite tokens com 15min de validade e não tem
// endpoint de refresh; o cookie acompanha essa validade.
const TOKEN_MAX_AGE = 60 * 15;

export async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function setToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearToken() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Usuario | null> {
  const token = await getToken();
  if (!token) return null;

  const res = await flaskFetch("/me", { token });
  if (!res.ok) return null;

  return res.json();
}
