import "server-only";
import { cookies } from "next/headers";
import { flaskFetch } from "@/lib/flask";
import type { Usuario } from "@/lib/types";

const ACCESS_COOKIE = "token";
const REFRESH_COOKIE = "refresh_token";

// Precisam bater com JWT_ACCESS_TOKEN_EXPIRES / JWT_REFRESH_TOKEN_EXPIRES no
// backend: o proxy.ts detecta "sessão expirada" pelo cookie de acesso ter
// sumido (maxAge estourado) e usa o refresh_token pra renovar sozinho.
const ACCESS_MAX_AGE = 60 * 60; // 1h
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}

/** Salva o token de acesso e, se vier (login/registro), o refresh token. */
export async function setTokens(accessToken: string, refreshToken?: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));

  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
  }
}

export async function clearTokens() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getSession(): Promise<Usuario | null> {
  const token = await getToken();
  if (!token) return null;

  const res = await flaskFetch("/me", { token });
  if (!res.ok) return null;

  return res.json();
}
