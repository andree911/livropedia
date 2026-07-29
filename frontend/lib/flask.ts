const FLASK_API_URL = process.env.FLASK_API_URL ?? "http://127.0.0.1:5001";

type FlaskFetchOptions = Omit<RequestInit, "body"> & {
  token?: string;
  body?: unknown;
};

export async function flaskFetch(path: string, options: FlaskFetchOptions = {}) {
  const { token, body, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  const isFormData = body instanceof FormData;

  if (body !== undefined && !isFormData) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${FLASK_API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    cache: "no-store",
  });
}

/** Livros enviados pelo próprio usuário guardam capa_url relativo (ex: /static/capas/x.jpg),
 *  que só existe no host do Flask. Capas da Open Library já vêm como URL absoluta. */
export function absolutizeCapaUrl(capaUrl: string | null): string | null {
  if (!capaUrl) return null;
  if (capaUrl.startsWith("http://") || capaUrl.startsWith("https://")) return capaUrl;
  return `${FLASK_API_URL}${capaUrl}`;
}
