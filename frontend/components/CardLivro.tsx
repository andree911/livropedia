import Link from "next/link";
import { absolutizeCapaUrl } from "@/lib/flask";
import type { Livro } from "@/lib/types";

export default function CardLivro({ livro }: { livro: Livro }) {
  const capa = absolutizeCapaUrl(livro.capa_url);

  return (
    <Link
      href={`/livros/${livro.id}`}
      className="block rounded border border-neutral-800 p-3 hover:border-neutral-600"
    >
      {capa && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={capa} alt={livro.titulo} className="mb-2 h-48 w-full rounded object-cover" />
      )}
      <p className="font-medium">{livro.titulo}</p>
      <p className="text-sm text-neutral-400">{livro.autor}</p>
      {livro.total_avaliacoes > 0 && (
        <p className="text-sm text-yellow-500">
          ★ {livro.nota_media.toFixed(1)} ({livro.total_avaliacoes})
        </p>
      )}
    </Link>
  );
}
