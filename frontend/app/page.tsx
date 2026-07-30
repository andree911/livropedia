import Link from "next/link";
import CardLivro from "@/components/CardLivro";
import { flaskFetch } from "@/lib/flask";
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
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {dados.livros.map((livro) => (
              <li key={livro.id}>
                <CardLivro livro={livro} />
              </li>
            ))}
          </ul>
          <PaginacaoCatalogo busca={busca} pagina={dados.page} totalPaginas={totalPaginas(dados)} />
        </>
      )}
    </div>
  );
}

function totalPaginas(dados: LivrosPaginados) {
  return Math.max(1, Math.ceil(dados.total / dados.per_page));
}

function PaginacaoCatalogo({
  busca,
  pagina,
  totalPaginas,
}: {
  busca: string;
  pagina: number;
  totalPaginas: number;
}) {
  if (totalPaginas <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    params.set("page", String(p));
    return `/?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between text-sm text-neutral-400">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} className="underline">
          ← Anterior
        </Link>
      ) : (
        <span />
      )}
      <span>
        Página {pagina} de {totalPaginas}
      </span>
      {pagina < totalPaginas ? (
        <Link href={href(pagina + 1)} className="underline">
          Próxima →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
