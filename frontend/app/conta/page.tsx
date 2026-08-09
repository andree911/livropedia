import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ContaForm from "./conta-form";

export default async function ContaPage() {
  const usuario = await getSession();

  if (!usuario) {
    redirect("/login");
  }

  return <ContaForm usuario={usuario} />;
}
