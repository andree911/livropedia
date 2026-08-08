import Link from "next/link";
import { redirect } from "next/navigation";
import { flaskFetch } from "@/lib/flask";
import { getSession, getToken } from "@/lib/session";
import type { MinhaAvaliacao } from "@/lib/types";
import ListaMinhasAvaliacoes from "./lista";

async function buscarMinhasAvaliacoes(token: string): Promise<MinhaAvaliacao[]> {
  const res = await flaskFetch("/minhas-avaliacoes", { token });
  if (!res.ok) return [];
  return res.json();
}

export default async function MinhasAvaliacoesPage() {
  const usuario = await getSession();
  if (!usuario) redirect("/login");

  const token = (await getToken())!;
  const avaliacoes = await buscarMinhasAvaliacoes(token);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Minhas avaliações</h1>

      {avaliacoes.length === 0 ? (
        <p className="text-neutral-400">
          Você ainda não avaliou nenhum livro.{" "}
          <Link href="/" className="underline">
            Que tal começar pelo catálogo?
          </Link>
        </p>
      ) : (
        <ListaMinhasAvaliacoes avaliacoes={avaliacoes} />
      )}
    </div>
  );
}
