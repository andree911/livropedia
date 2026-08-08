import "server-only";
import { flaskFetch } from "@/lib/flask";
import { getToken } from "@/lib/session";

/** Busca os titulos traduzidos (idioma da conta) pra uma lista de livros. */
export async function buscarTitulosTraduzidos(ids: number[]): Promise<Record<number, string>> {
  const token = await getToken();
  if (!token || ids.length === 0) return {};

  const res = await flaskFetch("/livros/traduzir-titulos", {
    method: "POST",
    token,
    body: { livro_ids: ids },
  });
  if (!res.ok) return {};

  const data = await res.json();
  return data.titulos ?? {};
}
