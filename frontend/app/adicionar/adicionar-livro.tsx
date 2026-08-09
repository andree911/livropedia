"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { ResultadoBuscaExterna } from "@/lib/types";

const DEBOUNCE_MS = 400;

export default function AdicionarLivro() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const buscaInicial = searchParams.get("q") ?? "";

  const [busca, setBusca] = useState(buscaInicial);
  const [resultados, setResultados] = useState<ResultadoBuscaExterna[]>([]);
  const [titulosTraduzidos, setTitulosTraduzidos] = useState<Record<string, string>>({});
  const [buscando, setBuscando] = useState(false);
  const [importando, setImportando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requisicaoAtual = useRef(0);

  async function traduzirTitulos(itens: ResultadoBuscaExterna[], id: number) {
    const titulos = itens.map((item) => item.titulo ?? "");

    const res = await fetch("/api/livros/traduzir-textos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textos: titulos }),
    });

    if (!res.ok || id !== requisicaoAtual.current) return;

    const data = await res.json().catch(() => null);
    const traduzidos: string[] = data?.textos ?? [];

    setTitulosTraduzidos((atual) => ({
      ...atual,
      ...Object.fromEntries(
        itens.map((item, i) => [item.external_id, traduzidos[i] ?? item.titulo ?? ""])
      ),
    }));
  }

  async function executarBusca(termo: string, id: number, atualizarUrl: boolean) {
    if (atualizarUrl) {
      router.replace(`${pathname}?q=${encodeURIComponent(termo)}`, { scroll: false });
    }

    const res = await fetch(`/api/livros/buscar-externo?q=${encodeURIComponent(termo)}`);
    const data = await res.json().catch(() => []);

    if (id !== requisicaoAtual.current) return;

    setBuscando(false);

    if (!res.ok) {
      setErro("Não foi possível buscar no Google Books.");
      return;
    }

    setResultados(data);
    traduzirTitulos(data, id);
  }

  // Restaura a busca a partir da URL ao montar - por exemplo, ao clicar
  // "voltar" no navegador depois de importar um livro, pra não perder a
  // pesquisa que já tinha sido feita. Sem setBuscando(true) aqui de
  // propósito (setState sincrono direto no efeito não é permitido); o
  // "Buscando..." só aparece em buscas disparadas pelo input mesmo.
  useEffect(() => {
    const termo = buscaInicial.trim();
    if (termo.length < 2) return;

    executarBusca(termo, ++requisicaoAtual.current, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBuscaChange(event: ChangeEvent<HTMLInputElement>) {
    const valor = event.target.value;
    setBusca(valor);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const termo = valor.trim();
    const id = ++requisicaoAtual.current;

    if (termo.length < 2) {
      setBuscando(false);
      setResultados([]);
      setTitulosTraduzidos({});
      setErro(null);
      router.replace(pathname, { scroll: false });
      return;
    }

    setBuscando(true);
    setErro(null);

    timeoutRef.current = setTimeout(() => executarBusca(termo, id, true), DEBOUNCE_MS);
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
        <p className="text-neutral-400">Busque no Google Books e importe o livro.</p>
      </div>

      <input
        value={busca}
        onChange={handleBuscaChange}
        placeholder="Título do livro..."
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
        autoFocus
      />

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      {buscando ? (
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 rounded border border-neutral-800 p-3">
              <div className="h-16 w-11 shrink-0 animate-pulse rounded bg-neutral-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-800" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
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
                  <p className="font-medium">
                    {titulosTraduzidos[resultado.external_id] ?? resultado.titulo}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {resultado.autor}
                    {resultado.ano_publicacao ? ` · ${resultado.ano_publicacao}` : ""}
                  </p>
                </div>
              </div>
              {resultado.livro_id ? (
                <Link
                  href={`/livros/${resultado.livro_id}`}
                  className="shrink-0 rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-800"
                >
                  Já no catálogo
                </Link>
              ) : (
                <button
                  onClick={() => handleImportar(resultado)}
                  disabled={importando === resultado.external_id}
                  className="shrink-0 rounded bg-neutral-800 px-3 py-1 text-sm hover:bg-neutral-700 disabled:opacity-50"
                >
                  {importando === resultado.external_id ? "Importando..." : "Importar"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
