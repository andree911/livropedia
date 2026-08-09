"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useRef, useState } from "react";

type CredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number }
          ) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleCredentialResponse(response: CredentialResponse) {
    setErro(null);

    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(data?.erro ?? "Não foi possível entrar com o Google.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  function handleScriptLoad() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !buttonRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });

    // Google só aceita um número fixo de pixels (máx. 400), então medimos
    // a largura real do container pra o botão acompanhar o resto do form.
    const largura = Math.min(buttonRef.current.offsetWidth, 400);

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: largura,
    });
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-2">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <div ref={buttonRef} />
      {erro && <p className="text-sm text-red-500">{erro}</p>}
    </div>
  );
}
