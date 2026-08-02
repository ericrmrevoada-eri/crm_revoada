"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Fica dentro do layout do PDV (cabeçalho/AdminShell continuam montados) —
// caminho crítico: o vendedor não pode ficar bloqueado com tela branca no
// meio de uma venda.
export default function PdvError({
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        Não foi possível carregar o PDV
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Algo deu errado ao buscar os dados do caixa/catálogo. Tente novamente.
      </p>
      <Button
        onClick={() => unstable_retry()}
        className="bg-gradient-neon text-white hover:opacity-90"
      >
        Tentar de novo
      </Button>
    </div>
  );
}
