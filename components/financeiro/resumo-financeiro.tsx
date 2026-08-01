import { ArrowDownRight, ArrowUpRight, Receipt, TrendingUp } from "lucide-react";
import type { ResumoFinanceiro, ResumoPeriodo } from "@/actions/despesas";
import { formatarMoeda } from "@/lib/formatters";
import { ROTULO_FORMA_PAGAMENTO } from "@/lib/validations/financeiro";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function Metrica({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: "positivo" | "negativo";
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p
        className={`font-heading text-xl font-bold tabular-nums ${
          destaque === "negativo" ? "text-destructive" : ""
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function CardPeriodo({
  titulo,
  periodo,
  icone,
}: {
  titulo: string;
  periodo: ResumoPeriodo;
  icone: React.ReactNode;
}) {
  const formas = Object.entries(periodo.por_forma).sort((a, b) => b[1] - a[1]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-sm uppercase tracking-wide">
          {icone}
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Metrica rotulo="Entradas (vendas)" valor={formatarMoeda(periodo.faturamento)} />
          <Metrica
            rotulo="Saídas (despesas)"
            valor={formatarMoeda(periodo.despesas)}
            destaque={periodo.despesas > 0 ? "negativo" : undefined}
          />
          <Metrica
            rotulo="Saldo"
            valor={formatarMoeda(periodo.saldo)}
            destaque={periodo.saldo < 0 ? "negativo" : "positivo"}
          />
          <Metrica rotulo="Ticket médio" valor={formatarMoeda(periodo.ticket_medio)} />
        </div>

        <Separator />

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            {periodo.vendas} {periodo.vendas === 1 ? "venda" : "vendas"} · {periodo.pecas}{" "}
            {periodo.pecas === 1 ? "peça" : "peças"}
          </span>
        </div>

        {formas.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Por forma de pagamento</p>
            {formas.map(([forma, valor]) => (
              <div key={forma} className="flex items-center justify-between text-sm">
                <span>
                  {ROTULO_FORMA_PAGAMENTO[forma as keyof typeof ROTULO_FORMA_PAGAMENTO] ?? forma}
                </span>
                <span className="tabular-nums">{formatarMoeda(valor)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResumoFinanceiroCards({ resumo }: { resumo: ResumoFinanceiro }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CardPeriodo
        titulo="Hoje"
        periodo={resumo.hoje}
        icone={<TrendingUp className="h-4 w-4 text-primary" />}
      />
      <CardPeriodo
        titulo="Mês corrente"
        periodo={resumo.mes}
        icone={<Receipt className="h-4 w-4 text-primary" />}
      />
      <p className="text-xs text-muted-foreground md:col-span-2">
        <ArrowUpRight className="mr-1 inline h-3 w-3" />
        Entradas contam apenas vendas concluídas.
        <ArrowDownRight className="mx-1 inline h-3 w-3" />
        Saídas contam todas as despesas do período, pagas do caixa ou não.
      </p>
    </div>
  );
}
