"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NOMES_LISTA, type NomeLista } from "@/lib/types";

export default function ListaToggles({
  livroId,
  listasAtuais,
}: {
  livroId: number;
  listasAtuais: NomeLista[];
}) {
  const router = useRouter();
  const [pendente, setPendente] = useState<NomeLista | null>(null);

  async function toggle(nome: NomeLista) {
    const jaEsta = listasAtuais.includes(nome);
    setPendente(nome);

    if (jaEsta) {
      await fetch(`/api/livros/${livroId}/listas/${encodeURIComponent(nome)}`, {
        method: "DELETE",
      });
    } else {
      await fetch(`/api/livros/${livroId}/listas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
    }

    setPendente(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {NOMES_LISTA.map((nome) => {
        const ativo = listasAtuais.includes(nome);
        return (
          <button
            key={nome}
            onClick={() => toggle(nome)}
            disabled={pendente === nome}
            className={
              ativo
                ? "rounded bg-neutral-100 px-3 py-1 text-sm text-neutral-900 disabled:opacity-50"
                : "rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-800 disabled:opacity-50"
            }
          >
            {ativo ? "✓ " : "+ "}
            {nome}
          </button>
        );
      })}
    </div>
  );
}
