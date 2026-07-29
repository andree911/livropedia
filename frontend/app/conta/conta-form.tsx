"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Usuario } from "@/lib/types";

export default function ContaForm({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const [nome, setNome] = useState(usuario.nome ?? "");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function handleSalvarNome(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setErro(null);
    setMensagem(null);

    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });

    const data = await res.json().catch(() => null);
    setSalvando(false);

    if (!res.ok) {
      setErro(data?.erro ?? "Não foi possível salvar.");
      return;
    }

    setMensagem("Nome atualizado.");
    router.refresh();
  }

  async function handleExcluirConta(event: FormEvent) {
    event.preventDefault();
    if (!confirm("Tem certeza que deseja apagar sua conta? Essa ação não pode ser desfeita.")) return;

    setExcluindo(true);
    setErro(null);

    const res = await fetch("/api/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    });

    const data = await res.json().catch(() => null);
    setExcluindo(false);

    if (!res.ok) {
      setErro(data?.erro ?? "Não foi possível apagar a conta.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Minha conta</h1>
        <p className="text-neutral-400">{usuario.email}</p>
      </div>

      <form onSubmit={handleSalvarNome} className="space-y-3">
        <label className="block text-sm text-neutral-400">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={Boolean(usuario.nome)}
          placeholder="Seu nome"
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 disabled:opacity-50"
        />
        {!usuario.nome && (
          <button
            type="submit"
            disabled={salvando}
            className="rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700 disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar nome"}
          </button>
        )}
        {mensagem && <p className="text-sm text-green-500">{mensagem}</p>}
      </form>

      <form onSubmit={handleExcluirConta} className="space-y-3 border-t border-neutral-800 pt-6">
        <label className="block text-sm text-neutral-400">Apagar conta</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Confirme sua senha"
          required
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        {erro && <p className="text-sm text-red-500">{erro}</p>}
        <button
          type="submit"
          disabled={excluindo}
          className="rounded bg-red-900 px-4 py-2 hover:bg-red-800 disabled:opacity-50"
        >
          {excluindo ? "Apagando..." : "Apagar conta"}
        </button>
      </form>
    </div>
  );
}
