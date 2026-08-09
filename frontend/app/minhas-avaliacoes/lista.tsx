"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { absolutizeCapaUrl } from "@/lib/flask";
import type { MinhaAvaliacao } from "@/lib/types";

/**
 * Mostra os titulos originais na hora (sem esperar a traducao) e troca
 * pelos traduzidos assim que chegarem, em vez de bloquear a pagina inteira
 * ate a MyMemory responder.
 */
export default function ListaMinhasAvaliacoes({ avaliacoes }: { avaliacoes: MinhaAvaliacao[] }) {
  const [titulosTraduzidos, setTitulosTraduzidos] = useState<Record<number, string>>({});

  useEffect(() => {
    const ids = avaliacoes
      .map((a) => a.livro?.id)
      .filter((id): id is number => typeof id === "number");
    if (ids.length === 0) return;

    const controller = new AbortController();

    fetch("/api/livros/traduzir-titulos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ livro_ids: ids }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.titulos) setTitulosTraduzidos(data.titulos);
      })
      .catch(() => {});

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avaliacoes.map((a) => a.livro?.id).join(",")]);

  return (
    <ul className="space-y-3">
      {avaliacoes.map((avaliacao) => {
        const livro = avaliacao.livro;
        const capa = livro ? absolutizeCapaUrl(livro.capa_url) : null;
        const titulo = livro ? (titulosTraduzidos[livro.id] ?? livro.titulo) : null;

        return (
          <li key={avaliacao.id} className="rounded border border-neutral-800 p-3">
            <div className="flex gap-3">
              {livro ? (
                <Link href={`/livros/${livro.id}`} className="flex shrink-0 gap-3">
                  {capa && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={capa} alt={titulo ?? ""} className="h-24 w-16 rounded object-cover" />
                  )}
                </Link>
              ) : null}

              <div className="min-w-0 flex-1">
                {livro ? (
                  <Link href={`/livros/${livro.id}`} className="font-medium hover:underline">
                    {titulo}
                  </Link>
                ) : (
                  <p className="font-medium text-neutral-500">Livro removido</p>
                )}
                {livro && <p className="text-sm text-neutral-400">{livro.autor}</p>}
                <p className="text-yellow-500">{"★".repeat(avaliacao.nota)}</p>
                {avaliacao.resenha && (
                  <p className="mt-1 text-sm text-neutral-300">{avaliacao.resenha}</p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
