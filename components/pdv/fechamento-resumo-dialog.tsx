"use client";

import type { ResumoCaixa } from "@/actions/caixa";
import { formatarMoeda } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ResumoFechado = ResumoCaixa & { valor_informado: number; diferenca: number };

function Linha({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="tabular-nums">{formatarMoeda(valor)}</span>
    </div>
  );
}

// Componente próprio, montado no topo da página (não dentro da barra do caixa):
// fechar o caixa faz o servidor devolver caixa=null e a barra some da árvore.
// Se essa conferência vivesse dentro dela, sumiria junto — e é exatamente a
// informação que o operador precisa ver antes de ir para a tela de abertura.
export function FechamentoResumoDialog({
  resultado,
  onClose,
}: {
  resultado: ResumoFechado | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={resultado !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Caixa fechado</DialogTitle>
          <DialogDescription>Conferência do turno.</DialogDescription>
        </DialogHeader>
        {resultado && (
          <div className="space-y-2">
            <Linha rotulo="Calculado pelo sistema" valor={resultado.valor_calculado} />
            <Linha rotulo="Informado por você" valor={resultado.valor_informado} />
            <Separator />
            <div
              className={`flex items-center justify-between rounded-lg p-3 text-sm font-semibold ${
                Math.abs(resultado.diferenca) < 0.01
                  ? "bg-muted text-foreground"
                  : "border border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              <span>
                {Math.abs(resultado.diferenca) < 0.01
                  ? "Sem divergência"
                  : resultado.diferenca > 0
                    ? "Sobra na gaveta"
                    : "Falta na gaveta"}
              </span>
              <span className="tabular-nums">{formatarMoeda(Math.abs(resultado.diferenca))}</span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
