"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Usuario } from "@/lib/types";

export default function Nav({ usuario }: { usuario: Usuario | null }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  async function handleLogout() {
    setSaindo(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setSaindo(false);
    setMenuAberto(false);
    router.push("/login");
    router.refresh();
  }

  const links = (
    <>
      <Link href="/" className="hover:underline" onClick={() => setMenuAberto(false)}>
        Catálogo
      </Link>
      {usuario && (
        <Link href="/adicionar" className="hover:underline" onClick={() => setMenuAberto(false)}>
          Adicionar
        </Link>
      )}
      {usuario && (
        <Link href="/listas" className="hover:underline" onClick={() => setMenuAberto(false)}>
          Minhas listas
        </Link>
      )}
      {usuario && (
        <Link
          href="/minhas-avaliacoes"
          className="hover:underline"
          onClick={() => setMenuAberto(false)}
        >
          Avaliações
        </Link>
      )}
      {usuario && (
        <Link href="/estatisticas" className="hover:underline" onClick={() => setMenuAberto(false)}>
          Estatísticas
        </Link>
      )}
      {usuario ? (
        <>
          <Link href="/conta" className="hover:underline" onClick={() => setMenuAberto(false)}>
            {usuario.nome || usuario.email}
          </Link>
          <button
            onClick={handleLogout}
            disabled={saindo}
            className="rounded bg-neutral-800 px-3 py-1 text-left hover:bg-neutral-700 disabled:opacity-50 sm:text-center"
          >
            {saindo ? "Saindo..." : "Sair"}
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="hover:underline" onClick={() => setMenuAberto(false)}>
            Entrar
          </Link>
          <Link href="/register" className="hover:underline" onClick={() => setMenuAberto(false)}>
            Criar conta
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Livropédia
        </Link>

        <div className="hidden items-center gap-4 text-sm sm:flex">{links}</div>

        <button
          onClick={() => setMenuAberto((aberto) => !aberto)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          className="flex h-9 w-9 items-center justify-center rounded border border-neutral-700 text-lg hover:bg-neutral-800 sm:hidden"
        >
          {menuAberto ? "✕" : "☰"}
        </button>
      </div>

      {menuAberto && (
        <div className="flex flex-col gap-3 border-t border-neutral-800 px-4 py-3 text-sm sm:hidden">
          {links}
        </div>
      )}
    </nav>
  );
}
