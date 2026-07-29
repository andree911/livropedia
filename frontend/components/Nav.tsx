"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Usuario } from "@/lib/types";

export default function Nav({ usuario }: { usuario: Usuario | null }) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function handleLogout() {
    setSaindo(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setSaindo(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-neutral-800 bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Enciclopédia de Livros
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">
            Catálogo
          </Link>
          {usuario && (
            <Link href="/adicionar" className="hover:underline">
              Adicionar
            </Link>
          )}
          {usuario ? (
            <>
              <Link href="/conta" className="hover:underline">
                {usuario.nome || usuario.email}
              </Link>
              <button
                onClick={handleLogout}
                disabled={saindo}
                className="rounded bg-neutral-800 px-3 py-1 hover:bg-neutral-700 disabled:opacity-50"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Entrar
              </Link>
              <Link href="/register" className="hover:underline">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
