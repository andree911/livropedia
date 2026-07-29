"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ResultadoBuscaExterna } from "@/lib/types";

export default function AdicionarLivro() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ResultadoBuscaExterna[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [importando, setImportando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleBuscar(event: FormEvent) {
    event.preventDefault();
    if (!busca.trim()) return;

    setBuscando(true);
    setErro(null);

    const res = await fetch(`/api/livros/buscar-externo?q=${encodeURIComponent(busca)}`);
    const data = await res.json().catch(() => []);

    setBuscando(false);

    if (!res.ok) {
      setErro("Não foi possível buscar na Open Library.");
      return;
    }

    setResultados(data);
  }

  async function handleImportar(resultado: ResultadoBuscaExterna) {
    setImportando(resultado.external_id);
    setErro(null);

    const res = await fetch("/api/livros/importar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultado),
    });

    const data = await res.json().catch(() => null);
    setImportando(null);

    if (!res.ok) {
      setErro(data?.erro ?? "Não foi possível importar este livro.");
      return;
    }

    router.push(`/livros/${data.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Adicionar livro</h1>
        <p className="text-neutral-400">Busque na Open Library e importe o livro.</p>
      </div>

      <form onSubmit={handleBuscar} className="flex gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Título do livro..."
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <button
          type="submit"
          disabled={buscando}
          className="rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700 disabled:opacity-50"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      <ul className="space-y-2">
        {resultados.map((resultado) => (
          <li
            key={resultado.external_id}
            className="flex items-center justify-between gap-4 rounded border border-neutral-800 p-3"
          >
            <div className="flex items-center gap-3">
              {resultado.capa_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resultado.capa_url}
                  alt={resultado.titulo ?? ""}
                  className="h-16 w-11 rounded object-cover"
                />
              )}
              <div>
                <p className="font-medium">{resultado.titulo}</p>
                <p className="text-sm text-neutral-400">
                  {resultado.autor}
                  {resultado.ano_publicacao ? ` · ${resultado.ano_publicacao}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleImportar(resultado)}
              disabled={importando === resultado.external_id}
              className="rounded bg-neutral-800 px-3 py-1 text-sm hover:bg-neutral-700 disabled:opacity-50"
            >
              {importando === resultado.external_id ? "Importando..." : "Importar"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
