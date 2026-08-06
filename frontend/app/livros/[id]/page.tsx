import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { absolutizeCapaUrl, flaskFetch } from "@/lib/flask";
import { getSession, getToken } from "@/lib/session";
import type { Avaliacao, AvaliacoesPaginadas, Livro, NomeLista } from "@/lib/types";
import FormularioAvaliacao from "./formulario-avaliacao";
import FormularioCapa from "./formulario-capa";
import FormularioEdicaoLivro from "./formulario-edicao";
import ListaToggles from "./lista-toggles";

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
    return { title: "Livro não encontrado — Enciclopédia de Livros" };
  }

  const descricao = livro.resumo ? livro.resumo.slice(0, 160) : `Livro de ${livro.autor}`;
  const capa = absolutizeCapaUrl(livro.capa_url);

  return {
    title: `${livro.titulo} — Enciclopédia de Livros`,
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
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{livro.titulo}</h1>
          <p className="text-neutral-400">{livro.autor}</p>
          {livro.ano_publicacao && (
            <p className="text-sm text-neutral-500">Publicado em {livro.ano_publicacao}</p>
          )}
          {livro.isbn && <p className="text-sm text-neutral-500">ISBN {livro.isbn}</p>}
          <p className="text-yellow-500">
            {livro.total_avaliacoes > 0
              ? `★ ${livro.nota_media.toFixed(1)} (${livro.total_avaliacoes} avaliação${
                  livro.total_avaliacoes > 1 ? "ões" : ""
                })`
              : "Ainda sem avaliações"}
          </p>
          {usuario && <ListaToggles livroId={livro.id} listasAtuais={minhasListas} />}
          {livro.resumo && (
            <div className="max-w-2xl space-y-3 text-neutral-200 [&_a]:underline [&_a]:text-neutral-300 [&_p]:leading-relaxed">
              <ReactMarkdown>{livro.resumo}</ReactMarkdown>
            </div>
          )}
        </div>
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
