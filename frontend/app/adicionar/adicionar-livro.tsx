"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import type { ResultadoBuscaExterna } from "@/lib/types";

const DEBOUNCE_MS = 400;

export default function AdicionarLivro() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ResultadoBuscaExterna[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [importando, setImportando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requisicaoAtual = useRef(0);

  function handleBuscaChange(event: ChangeEvent<HTMLInputElement>) {
    const valor = event.target.value;
    setBusca(valor);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const termo = valor.trim();
    const id = ++requisicaoAtual.current;

    if (termo.length < 2) {
      setBuscando(false);
      setResultados([]);
      setErro(null);
      return;
    }

    setBuscando(true);
    setErro(null);

    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(`/api/livros/buscar-externo?q=${encodeURIComponent(termo)}`);
      const data = await res.json().catch(() => []);

      if (id !== requisicaoAtual.current) return;

      setBuscando(false);

      if (!res.ok) {
        setErro("Não foi possível buscar na Open Library.");
        return;
      }

      setResultados(data);
    }, DEBOUNCE_MS);
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

      <div className="relative">
        <input
          value={busca}
          onChange={handleBuscaChange}
          placeholder="Título do livro..."
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
          autoFocus
        />
        {buscando && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            Buscando...
          </span>
        )}
      </div>

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
