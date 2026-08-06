"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Avaliacao } from "@/lib/types";

export default function FormularioAvaliacao({
  livroId,
  avaliacaoExistente,
}: {
  livroId: number;
  avaliacaoExistente: Avaliacao | null;
}) {
  const router = useRouter();
  const [nota, setNota] = useState(avaliacaoExistente?.nota ?? 5);
  const [resenha, setResenha] = useState(avaliacaoExistente?.resenha ?? "");
  const [enviando, setEnviando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setErro(null);

    const res = await fetch(`/api/livros/${livroId}/avaliacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nota, resenha: resenha || null }),
    });

    setEnviando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.erro ?? "Não foi possível enviar sua avaliação.");
      return;
    }

    router.refresh();
  }

  async function handleApagar() {
    if (!avaliacaoExistente) return;

    setApagando(true);
    setErro(null);

    const res = await fetch(`/api/avaliacoes/${avaliacaoExistente.id}`, {
      method: "DELETE",
    });

    setApagando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.erro ?? "Não foi possível apagar sua avaliação.");
      return;
    }

    setNota(5);
    setResenha("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded border border-neutral-800 p-4">
      <div className="flex items-center gap-2">
        <label htmlFor="nota">Sua nota</label>
        <select
          id="nota"
          value={nota}
          onChange={(e) => setNota(Number(e.target.value))}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={resenha}
        onChange={(e) => setResenha(e.target.value)}
        placeholder="Escreva uma resenha (opcional)"
        rows={3}
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
      />
      {erro && <p className="text-sm text-red-500">{erro}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando || apagando}
          className="rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700 disabled:opacity-50"
        >
          {enviando
            ? "Enviando..."
            : avaliacaoExistente
              ? "Atualizar avaliação"
              : "Avaliar"}
        </button>
        {avaliacaoExistente && (
          <button
            type="button"
            onClick={handleApagar}
            disabled={enviando || apagando}
            className="rounded border border-neutral-700 px-4 py-2 text-red-400 hover:bg-neutral-800 disabled:opacity-50"
          >
            {apagando ? "Apagando..." : "Apagar avaliação"}
          </button>
        )}
      </div>
    </form>
  );
}
