"use client";

import { Receipt } from "lucide-react";
import type { Caixa, MovimentacaoCaixa, ResumoCaixa } from "@/actions/caixa";
import { formatarDataHora, formatarMoeda } from "@/lib/formatters";
import { ROTULO_FORMA_PAGAMENTO } from "@/lib/validations/financeiro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MovimentacaoDialog } from "@/components/pdv/movimentacao-dialog";
import { FecharCaixaDialog } from "@/components/pdv/fechar-caixa-dialog";

const ROTULO_TIPO: Record<MovimentacaoCaixa["tipo"], string> = {
  venda: "Venda",
  sangria: "Sangria",
  suprimento: "Suprimento",
  despesa: "Despesa",
};

export function CaixaBar({
  caixa,
  resumo,
  movimentacoes,
}: {
  caixa: Caixa;
  resumo: ResumoCaixa | null;
  movimentacoes: MovimentacaoCaixa[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Caixa aberto</Badge>
          <span className="text-xs text-muted-foreground">
            desde {formatarDataHora(caixa.data_abertura)}
          </span>
        </div>
        <p className="font-heading text-lg font-bold tabular-nums">
          {formatarMoeda(resumo?.valor_calculado ?? caixa.valor_abertura)}
          <span className="ml-2 text-xs font-normal text-muted-foreground">na gaveta</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" variant="outline">
              <Receipt className="h-4 w-4" />
              Extrato
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Extrato do caixa</SheetTitle>
              <SheetDescription>
                Movimentações desde a abertura, da mais recente para a mais antiga.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-2 px-4 pb-4">
              {movimentacoes.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma movimentação ainda.
                </p>
              ) : (
                movimentacoes.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {ROTULO_TIPO[m.tipo]}
                        {m.forma_pagamento && (
                          <span className="ml-1 font-normal text-muted-foreground">
                            ·{" "}
                            {ROTULO_FORMA_PAGAMENTO[
                              m.forma_pagamento as keyof typeof ROTULO_FORMA_PAGAMENTO
                            ] ?? m.forma_pagamento}
                          </span>
                        )}
                      </p>
                      {m.descricao && (
                        <p className="truncate text-xs text-muted-foreground">{m.descricao}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatarDataHora(m.criado_em)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 tabular-nums ${
                        m.tipo === "sangria" || m.tipo === "despesa" ? "text-destructive" : ""
                      }`}
                    >
                      {m.tipo === "sangria" || m.tipo === "despesa" ? "− " : "+ "}
                      {formatarMoeda(m.valor)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        <MovimentacaoDialog caixaId={caixa.id} />
        <FecharCaixaDialog caixaId={caixa.id} resumo={resumo} />
      </div>
    </div>
  );
}
