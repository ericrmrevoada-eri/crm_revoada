"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Pega qualquer erro não capturado por um boundary mais específico — falha em
// app/(admin)/layout.tsx ou app/pdv/layout.tsx, ou nas páginas públicas de
// auth (login/esqueci-senha/redefinir-senha), que não têm layout próprio.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="font-heading text-lg font-bold uppercase tracking-wide text-gradient-neon">
        Revoada
      </span>
      <h1 className="text-xl font-semibold text-foreground">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Não foi possível carregar esta página. Tente novamente ou volte para o
        início.
      </p>
      <div className="flex gap-2">
        <Button
          onClick={() => unstable_retry()}
          className="bg-gradient-neon text-white hover:opacity-90"
        >
          Tentar de novo
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Voltar para o início</Link>
        </Button>
      </div>
    </div>
  );
}
