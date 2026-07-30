import Link from "next/link";
import { redirect } from "next/navigation";
import { absolutizeCapaUrl, flaskFetch } from "@/lib/flask";
import { getSession, getToken } from "@/lib/session";
import { NOMES_LISTA, type MinhasListas } from "@/lib/types";

async function buscarMinhasListas(token: string): Promise<MinhasListas> {
  const vazio = { "Quero ler": [], Lendo: [], Lido: [] } as MinhasListas;

  const res = await flaskFetch("/listas", { token });
  if (!res.ok) return vazio;

  return res.json();
}

export default async function ListasPage() {
  const usuario = await getSession();
  if (!usuario) redirect("/login");

  const token = (await getToken())!;
  const listas = await buscarMinhasListas(token);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Minhas listas</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {NOMES_LISTA.map((nome) => {
          const livros = listas[nome];
          const capas = livros
            .map((livro) => absolutizeCapaUrl(livro.capa_url))
            .filter((capa): capa is string => Boolean(capa))
            .slice(0, 4);

          return (
            <Link
              key={nome}
              href={`/listas/${encodeURIComponent(nome)}`}
              className="block rounded border border-neutral-800 p-4 hover:border-neutral-600"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">{nome}</h2>
                <span className="text-sm text-neutral-400">{livros.length}</span>
              </div>

              {capas.length > 0 ? (
                <div className="mt-4 flex -space-x-4">
                  {capas.map((capa, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={capa}
                      alt=""
                      className="h-20 w-14 rounded border-2 border-neutral-950 object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-neutral-500">Nenhum livro aqui ainda.</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
