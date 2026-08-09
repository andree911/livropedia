"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Livro } from "@/lib/types";

export default function FormularioEdicaoLivro({ livro }: { livro: Livro }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(livro.titulo);
  const [autor, setAutor] = useState(livro.autor);
  const [resumo, setResumo] = useState(livro.resumo ?? "");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setErro(null);

    const res = await fetch(`/api/livros/${livro.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, autor, resumo }),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.erro ?? "Não foi possível salvar.");
      return;
    }

    router.refresh();
  }

  async function handleExcluir() {
    if (!confirm("Tem certeza que deseja excluir este livro?")) return;

    setExcluindo(true);
    setErro(null);

    const res = await fetch(`/api/livros/${livro.id}`, { method: "DELETE" });

    if (!res.ok) {
      setExcluindo(false);
      setErro("Não foi possível excluir.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded border border-neutral-800 p-4">
      <h2 className="font-medium">Editar livro</h2>
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título"
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
      />
      <input
        value={autor}
        onChange={(e) => setAutor(e.target.value)}
        placeholder="Autor"
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
      />
      <textarea
        value={resumo}
        onChange={(e) => setResumo(e.target.value)}
        placeholder="Resumo"
        rows={4}
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
      />
      {erro && <p className="text-sm text-red-500">{erro}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={handleExcluir}
          disabled={excluindo}
          className="rounded bg-red-900 px-4 py-2 hover:bg-red-800 disabled:opacity-50"
        >
          {excluindo ? "Excluindo..." : "Excluir livro"}
        </button>
      </div>
    </form>
  );
}
