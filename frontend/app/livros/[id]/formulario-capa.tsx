"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

export default function FormularioCapa({ livroId }: { livroId: number }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setEnviando(true);
    setErro(null);

    const formData = new FormData();
    formData.append("capa", file);

    const res = await fetch(`/api/livros/${livroId}/upload-capa`, {
      method: "POST",
      body: formData,
    });

    setEnviando(false);
    event.target.value = "";

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.erro ?? "Não foi possível enviar a capa.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm text-neutral-400">Trocar capa</label>
      <input type="file" accept="image/*" onChange={handleChange} disabled={enviando} />
      {erro && <p className="text-sm text-red-500">{erro}</p>}
    </div>
  );
}
