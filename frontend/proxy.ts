import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FLASK_API_URL = process.env.FLASK_API_URL ?? "http://127.0.0.1:5001";

const ACCESS_COOKIE = "token";
const REFRESH_COOKIE = "refresh_token";
const ACCESS_MAX_AGE = 60 * 60; // precisa bater com JWT_ACCESS_TOKEN_EXPIRES no backend

// O cookie de acesso tem maxAge igual ao do JWT, então o navegador o
// descarta sozinho quando expira. "cookie de acesso sumiu + refresh_token
// presente" é justamente o sinal de que a sessão precisa ser renovada -
// sem precisar decodificar o JWT pra checar validade.
export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken || !refreshToken) {
    return NextResponse.next();
  }

  const res = await fetch(`${FLASK_API_URL}/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  if (!res.ok) {
    return NextResponse.next();
  }

  const data = await res.json();

  // Propaga o cookie renovado pra essa mesma requisição (não só pras futuras)
  request.cookies.set(ACCESS_COOKIE, data.access_token);
  const response = NextResponse.next({ request });

  response.cookies.set(ACCESS_COOKIE, data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
