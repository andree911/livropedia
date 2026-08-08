import Link from "next/link";
import { redirect } from "next/navigation";
import { flaskFetch } from "@/lib/flask";
import { getSession, getToken } from "@/lib/session";
import type { Estatisticas } from "@/lib/types";

const ACCENT = "#3987e5";

async function buscarEstatisticas(token: string): Promise<Estatisticas | null> {
  const res = await flaskFetch("/estatisticas", { token });
  if (!res.ok) return null;
  return res.json();
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-neutral-800 p-4">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
}

function GraficoBarrasVerticais({
  titulo,
  dados,
}: {
  titulo: string;
  dados: { rotulo: string; valor: number }[];
}) {
  const max = Math.max(1, ...dados.map((d) => d.valor));

  return (
    <div className="rounded border border-neutral-800 p-4">
      <h2 className="mb-4 text-sm font-medium text-neutral-300">{titulo}</h2>
      <div className="flex gap-2">
        {dados.map((d) => (
          <div key={d.rotulo} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs text-neutral-400">{d.valor}</span>
            <div className="flex h-32 w-full items-end justify-center">
              <div
                title={`${d.rotulo}: ${d.valor}`}
                className="w-full max-w-6 rounded-t"
                style={{
                  height: `${(d.valor / max) * 100}%`,
                  minHeight: d.valor > 0 ? "2px" : 0,
                  backgroundColor: ACCENT,
                }}
              />
            </div>
            <span className="text-xs text-neutral-500">{d.rotulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraficoBarrasHorizontais({
  titulo,
  dados,
}: {
  titulo: string;
  dados: { rotulo: string; valor: number }[];
}) {
  const max = Math.max(1, ...dados.map((d) => d.valor));

  return (
    <div className="rounded border border-neutral-800 p-4">
      <h2 className="mb-4 text-sm font-medium text-neutral-300">{titulo}</h2>
      <div className="space-y-2">
        {dados.map((d) => (
          <div key={d.rotulo} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-sm text-neutral-400" title={d.rotulo}>
              {d.rotulo}
            </span>
            <div className="flex-1">
              <div
                title={`${d.rotulo}: ${d.valor}`}
                className="rounded-r"
                style={{
                  width: `${(d.valor / max) * 100}%`,
                  minWidth: "2px",
                  height: "20px",
                  backgroundColor: ACCENT,
                }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-sm text-neutral-400">{d.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function EstatisticasPage() {
  const usuario = await getSession();
  if (!usuario) redirect("/login");

  const token = (await getToken())!;
  const stats = await buscarEstatisticas(token);

  if (!stats) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Estatísticas</h1>
        <p className="text-neutral-400">Não foi possível carregar suas estatísticas.</p>
      </div>
    );
  }

  const semDados = stats.total_lidos === 0 && stats.total_avaliacoes === 0;

  const porAno = Object.entries(stats.lidos_por_ano).map(([ano, total]) => ({
    rotulo: ano,
    valor: total,
  }));

  const porNota = [1, 2, 3, 4, 5].map((n) => ({
    rotulo: "★".repeat(n),
    valor: stats.distribuicao_notas[String(n)] ?? 0,
  }));

  const porAutor = stats.autores_mais_lidos.map((a) => ({
    rotulo: a.autor,
    valor: a.total,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Estatísticas</h1>

      {semDados ? (
        <p className="text-neutral-400">
          Ainda não há dados suficientes.{" "}
          <Link href="/listas" className="underline">
            Marque alguns livros como lidos
          </Link>{" "}
          ou avalie um livro pra começar a ver seus números aqui.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Livros lidos" value={stats.total_lidos} />
            <StatTile label="Avaliações feitas" value={stats.total_avaliacoes} />
            <StatTile label="Nota média que você dá" value={stats.nota_media_dada.toFixed(1)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {porAno.length > 0 && (
              <GraficoBarrasVerticais titulo="Livros lidos por ano" dados={porAno} />
            )}
            {stats.total_avaliacoes > 0 && (
              <GraficoBarrasVerticais titulo="Distribuição das suas notas" dados={porNota} />
            )}
          </div>

          {porAutor.length > 0 && (
            <GraficoBarrasHorizontais titulo="Autores mais lidos" dados={porAutor} />
          )}
        </>
      )}
    </div>
  );
}
