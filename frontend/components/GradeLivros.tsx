"use client";

import { useEffect, useState } from "react";
import CardLivro from "@/components/CardLivro";
import type { Livro } from "@/lib/types";

/**
 * Mostra a grade com o titulo original na hora (sem esperar a traducao) e
 * troca pelo traduzido assim que ele chegar, em vez de bloquear a pagina
 * inteira ate a MyMemory responder.
 */
export default function GradeLivros({ livros }: { livros: Livro[] }) {
  const [titulosTraduzidos, setTitulosTraduzidos] = useState<Record<number, string>>({});

  useEffect(() => {
    const ids = livros.map((livro) => livro.id);
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
  }, [livros.map((livro) => livro.id).join(",")]);

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {livros.map((livro) => (
        <li key={livro.id}>
          <CardLivro livro={{ ...livro, titulo: titulosTraduzidos[livro.id] ?? livro.titulo }} />
        </li>
      ))}
    </ul>
  );
}
