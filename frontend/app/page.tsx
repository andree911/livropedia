import Link from "next/link";
import { absolutizeCapaUrl, flaskFetch } from "@/lib/flask";
import type { LivrosPaginados } from "@/lib/types";

async function buscarLivros(busca: string, page: number): Promise<LivrosPaginados> {
  const path = busca
    ? `/livros/titulo/${encodeURIComponent(busca)}?page=${page}`
    : `/livros?page=${page}`;

  const res = await flaskFetch(path);
  if (!res.ok) return { livros: [], total: 0, page: 1, per_page: 20 };
  return res.json();
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; page?: string }>;
}) {
  const { busca = "", page = "1" } = await searchParams;
  const dados = await buscarLivros(busca, Number(page) || 1);

  return (
    <div className="space-y-6">
      <form className="flex gap-2">
        <input
          type="text"
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por título..."
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700"
        >
          Buscar
        </button>
      </form>

      {dados.livros.length === 0 ? (
        <p className="text-neutral-400">
          Nenhum livro encontrado.{" "}
          <Link href="/adicionar" className="underline">
            Que tal adicionar um?
          </Link>
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {dados.livros.map((livro) => {
            const capa = absolutizeCapaUrl(livro.capa_url);
            return (
              <li key={livro.id}>
                <Link
                  href={`/livros/${livro.id}`}
                  className="block rounded border border-neutral-800 p-3 hover:border-neutral-600"
                >
                  {capa && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={capa}
                      alt={livro.titulo}
                      className="mb-2 h-48 w-full rounded object-cover"
                    />
                  )}
                  <p className="font-medium">{livro.titulo}</p>
                  <p className="text-sm text-neutral-400">{livro.autor}</p>
                  {livro.total_avaliacoes > 0 && (
                    <p className="text-sm text-yellow-500">
                      ★ {livro.nota_media.toFixed(1)} ({livro.total_avaliacoes})
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
