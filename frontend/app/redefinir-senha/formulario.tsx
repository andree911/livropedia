"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function RedefinirSenhaForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setErro(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, senha }),
    });

    setEnviando(false);

    if (!res.ok) {
      setErro("Não foi possível redefinir a senha. O link pode ter expirado.");
      return;
    }

    setSucesso(true);
  }

  if (!token) {
    return (
      <p className="mx-auto max-w-sm text-neutral-400">
        Link inválido. Solicite uma nova recuperação de senha.
      </p>
    );
  }

  if (sucesso) {
    return (
      <p className="mx-auto max-w-sm text-neutral-200">
        Senha redefinida!{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Redefinir senha</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Nova senha"
          required
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        {erro && <p className="text-sm text-red-500">{erro}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700 disabled:opacity-50"
        >
          {enviando ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>
    </div>
  );
}
