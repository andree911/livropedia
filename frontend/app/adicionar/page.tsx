import Link from "next/link";
import { getSession } from "@/lib/session";
import AdicionarLivro from "./adicionar-livro";

export default async function AdicionarPage() {
  const usuario = await getSession();

  if (!usuario) {
    return (
      <p className="text-neutral-400">
        <Link href="/login" className="underline">
          Entre
        </Link>{" "}
        para adicionar um livro.
      </p>
    );
  }

  return <AdicionarLivro />;
}
