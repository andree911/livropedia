import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absolutizeCapaUrl, flaskFetch } from "@/lib/flask";
import { getSession, getToken } from "@/lib/session";
import type { Avaliacao, AvaliacoesPaginadas, Livro, NomeLista } from "@/lib/types";
import DetalhesLivro from "./titulo-resumo";
import FormularioAvaliacao from "./formulario-avaliacao";
import FormularioCapa from "./formulario-capa";
import FormularioEdicaoLivro from "./formulario-edicao";

async function buscarLivro(id: string): Promise<Livro | null> {
  const res = await flaskFetch(`/livros/id/${id}`);
  if (!res.ok) return null;
  return res.json();
}

async function buscarAvaliacoes(id: string): Promise<AvaliacoesPaginadas> {
  const res = await flaskFetch(`/livros/${id}/avaliacoes`);
  if (!res.ok) return { avaliacoes: [], total: 0, page: 1, per_page: 20 };
  return res.json();
}

async function buscarMinhasListas(id: string): Promise<NomeLista[]> {
  const token = await getToken();
  if (!token) return [];

  const res = await flaskFetch(`/livros/${id}/minhas-listas`, { token });
  if (!res.ok) return [];

  const data = await res.json();
  return data.listas ?? [];
}

async function buscarMinhaAvaliacao(id: string): Promise<Avaliacao | null> {
  const token = await getToken();
  if (!token) return null;

  const res = await flaskFetch(`/livros/${id}/minha-avaliacao`, { token });
  if (!res.ok) return null;

  const data = await res.json();
  return data.avaliacao ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const livro = await buscarLivro(id);

  if (!livro) {
    return { title: "Livro não encontrado — Livropédia" };
  }

  const descricao = livro.resumo ? livro.resumo.slice(0, 160) : `Livro de ${livro.autor}`;
  const capa = absolutizeCapaUrl(livro.capa_url);

  return {
    title: `${livro.titulo} — Livropédia`,
    description: descricao,
    openGraph: {
      title: livro.titulo,
      description: descricao,
      images: capa ? [capa] : undefined,
    },
  };
}

export default async function LivroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [livro, avaliacoes, usuario, minhasListas, minhaAvaliacao] = await Promise.all([
    buscarLivro(id),
    buscarAvaliacoes(id),
    getSession(),
    buscarMinhasListas(id),
    buscarMinhaAvaliacao(id),
  ]);

  if (!livro) notFound();

  const capa = absolutizeCapaUrl(livro.capa_url);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        {capa && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capa} alt={livro.titulo} className="h-72 w-48 rounded object-cover" />
        )}
        <DetalhesLivro livro={livro} logado={Boolean(usuario)} minhasListas={minhasListas} />
      </div>

      {usuario ? (
        <FormularioAvaliacao livroId={livro.id} avaliacaoExistente={minhaAvaliacao} />
      ) : (
        <p className="text-neutral-400">
          <a href="/login" className="underline">
            Entre
          </a>{" "}
          para avaliar este livro.
        </p>
      )}

      <div>
        <h2 className="mb-2 text-lg font-medium">Avaliações ({avaliacoes.total})</h2>
        {avaliacoes.avaliacoes.length === 0 ? (
          <p className="text-neutral-400">Nenhuma avaliação ainda.</p>
        ) : (
          <ul className="space-y-3">
            {avaliacoes.avaliacoes.map((avaliacao) => (
              <li key={avaliacao.id} className="rounded border border-neutral-800 p-3">
                <p className="text-yellow-500">★ {avaliacao.nota}</p>
                {avaliacao.resenha && <p className="text-neutral-200">{avaliacao.resenha}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {usuario && (
        <div className="space-y-4 border-t border-neutral-800 pt-6">
          <FormularioCapa livroId={livro.id} />
          <FormularioEdicaoLivro livro={livro} />
        </div>
      )}
    </div>
  );
}
