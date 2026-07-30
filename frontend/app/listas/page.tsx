import { redirect } from "next/navigation";
import CardLivro from "@/components/CardLivro";
import { flaskFetch } from "@/lib/flask";
import { getSession, getToken } from "@/lib/session";
import { NOMES_LISTA, type MinhasListas } from "@/lib/types";

async function buscarMinhasListas(token: string): Promise<MinhasListas> {
  const vazio = { "Quero ler": [], Lendo: [], Lido: [] } as MinhasListas;

  const res = await flaskFetch("/listas", { token });
  if (!res.ok) return vazio;

  return res.json();
}

export default async function ListasPage() {
  const usuario = await getSession();
  if (!usuario) redirect("/login");

  const token = (await getToken())!;
  const listas = await buscarMinhasListas(token);

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold">Minhas listas</h1>

      {NOMES_LISTA.map((nome) => (
        <section key={nome} className="space-y-3">
          <h2 className="text-lg font-medium">
            {nome} ({listas[nome].length})
          </h2>
          {listas[nome].length === 0 ? (
            <p className="text-neutral-400">Nenhum livro aqui ainda.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {listas[nome].map((livro) => (
                <li key={livro.id}>
                  <CardLivro livro={livro} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
