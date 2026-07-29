"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function FormularioAvaliacao({ livroId }: { livroId: number }) {
  const router = useRouter();
  const [nota, setNota] = useState(5);
  const [resenha, setResenha] = useState("");
  const [enviando, setEnviando] = useState(false);
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
      <button
        type="submit"
        disabled={enviando}
        className="rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700 disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Avaliar"}
      </button>
    </form>
  );
}
