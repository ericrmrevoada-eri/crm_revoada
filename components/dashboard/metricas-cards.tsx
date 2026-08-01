import type { MetricasTempoReal } from "@/actions/dashboard";
import { formatarMoeda } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";

function Cartao({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{rotulo}</p>
        <p className="font-heading text-2xl font-bold tabular-nums">{valor}</p>
      </CardContent>
    </Card>
  );
}

export function MetricasCards({ metricas }: { metricas: MetricasTempoReal }) {
  return (
    <div className="space-y-3">
      <div>
        <CardTitleSecao titulo="Hoje" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Cartao rotulo="Faturamento" valor={formatarMoeda(metricas.hoje.faturamento)} />
          <Cartao rotulo="Ticket médio" valor={formatarMoeda(metricas.hoje.ticketMedio)} />
          <Cartao rotulo="Peças vendidas" valor={String(metricas.hoje.pecas)} />
          <Cartao rotulo="Vendas" valor={String(metricas.hoje.vendas)} />
        </div>
      </div>
      <div>
        <CardTitleSecao titulo="Mês corrente" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Cartao rotulo="Faturamento" valor={formatarMoeda(metricas.mes.faturamento)} />
          <Cartao rotulo="Ticket médio" valor={formatarMoeda(metricas.mes.ticketMedio)} />
          <Cartao rotulo="Peças vendidas" valor={String(metricas.mes.pecas)} />
          <Cartao rotulo="Vendas" valor={String(metricas.mes.vendas)} />
        </div>
      </div>
    </div>
  );
}

function CardTitleSecao({ titulo }: { titulo: string }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {titulo}
    </p>
  );
}
