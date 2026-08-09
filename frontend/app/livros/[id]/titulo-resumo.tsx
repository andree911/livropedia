"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Livro, NomeLista, Traducao } from "@/lib/types";
import ListaToggles from "./lista-toggles";

/**
 * Mostra titulo/resumo originais na hora (sem esperar a traducao) e troca
 * pelos traduzidos assim que chegarem, em vez de bloquear a pagina inteira
 * ate a MyMemory responder. Junto do resto da coluna de detalhes (autor,
 * ano, ISBN, nota, listas) pra manter a ordem visual sem duplicar a busca
 * da traducao em dois componentes separados.
 */
export default function DetalhesLivro({
  livro,
  logado,
  minhasListas,
}: {
  livro: Livro;
  logado: boolean;
  minhasListas: NomeLista[];
}) {
  const [traducao, setTraducao] = useState<Traducao | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/livros/${livro.id}/traducao`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.traducao) setTraducao(data.traducao);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [livro.id]);

  const titulo = traducao?.titulo || livro.titulo;
  const resumo = traducao?.resumo || livro.resumo;

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
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
      {logado && <ListaToggles livroId={livro.id} listasAtuais={minhasListas} />}
      {resumo && (
        <div className="max-w-2xl space-y-1">
          {traducao && <p className="text-xs text-neutral-500">Traduzido automaticamente</p>}
          <div className="space-y-3 text-neutral-200 [&_a]:underline [&_a]:text-neutral-300 [&_p]:leading-relaxed">
            <ReactMarkdown>{resumo}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
