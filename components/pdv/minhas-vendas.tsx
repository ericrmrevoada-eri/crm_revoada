import type { VendaResumida } from "@/actions/vendas";
import { formatarDataHora, formatarMoeda } from "@/lib/formatters";
import { ROTULO_FORMA_PAGAMENTO } from "@/lib/validations/financeiro";
import { Badge } from "@/components/ui/badge";

// Desempenho do próprio operador — vendedor vê as vendas dele, nunca o
// consolidado da loja (isso é dashboard de admin).
export function MinhasVendas({ vendas }: { vendas: VendaResumida[] }) {
  if (vendas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhuma venda registrada ainda.
      </p>
    );
  }

  const concluidas = vendas.filter((v) => v.status === "concluida");
  const total = concluidas.reduce((acc, v) => acc + v.valor_total, 0);
  const pecas = concluidas.reduce((acc, v) => acc + v.total_pecas, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-card p-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Últimas vendas</p>
          <p className="font-heading text-lg font-bold tabular-nums">{concluidas.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Peças</p>
          <p className="font-heading text-lg font-bold tabular-nums">{pecas}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Valor</p>
          <p className="font-heading text-lg font-bold tabular-nums">{formatarMoeda(total)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {vendas.map((venda) => (
          <div
            key={venda.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {venda.total_pecas} {venda.total_pecas === 1 ? "peça" : "peças"} ·{" "}
                {ROTULO_FORMA_PAGAMENTO[
                  venda.forma_pagamento as keyof typeof ROTULO_FORMA_PAGAMENTO
                ] ?? venda.forma_pagamento}
              </p>
              <p className="text-xs text-muted-foreground">{formatarDataHora(venda.criado_em)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {venda.status === "cancelada" && <Badge variant="destructive">cancelada</Badge>}
              {venda.desconto > 0 && (
                <Badge variant="outline">−{formatarMoeda(venda.desconto)}</Badge>
              )}
              <span className="tabular-nums">{formatarMoeda(venda.valor_total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
