import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CardLivro from "@/components/CardLivro";
import { flaskFetch } from "@/lib/flask";
import { getSession, getToken } from "@/lib/session";
import { NOMES_LISTA, type MinhasListas, type NomeLista } from "@/lib/types";

async function buscarMinhasListas(token: string): Promise<MinhasListas> {
  const vazio = { "Quero ler": [], Lendo: [], Lido: [] } as MinhasListas;

  const res = await flaskFetch("/listas", { token });
  if (!res.ok) return vazio;

  return res.json();
}

export default async function ListaPage({ params }: { params: Promise<{ nome: string }> }) {
  const { nome: nomeParam } = await params;
  const nomeDecodificado = decodeURIComponent(nomeParam);

  if (!(NOMES_LISTA as readonly string[]).includes(nomeDecodificado)) notFound();
  const nome = nomeDecodificado as NomeLista;

  const usuario = await getSession();
  if (!usuario) redirect("/login");

  const token = (await getToken())!;
  const listas = await buscarMinhasListas(token);
  const livros = listas[nome];

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <Link href="/listas" className="block text-sm text-neutral-400 hover:text-neutral-200">
          ← Minhas listas
        </Link>
        <h1 className="text-xl font-semibold">
          {nome} ({livros.length})
        </h1>
      </div>

      {livros.length === 0 ? (
        <p className="text-neutral-400">Nenhum livro aqui ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {livros.map((livro) => (
            <li key={livro.id}>
              <CardLivro livro={livro} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
