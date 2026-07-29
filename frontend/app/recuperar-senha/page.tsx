"use client";

import { useState, type FormEvent } from "react";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setEnviando(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setEnviando(false);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <p className="mx-auto max-w-sm text-neutral-200">
        Se o email existir, enviaremos instruções para redefinir a senha.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Recuperar senha</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700 disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
