import type { Metadata } from "next";
import {
  listarDesempenhoVendedores,
  listarTopProdutos,
  obterMetricasTempoReal,
} from "@/actions/dashboard";
import { periodoPadrao, type Periodo } from "@/lib/dashboard/periodo";
import { MetricasCards } from "@/components/dashboard/metricas-cards";
import { RealtimeWatcher } from "@/components/dashboard/realtime-watcher";
import { PeriodoForm } from "@/components/dashboard/periodo-form";
import { ExportarButtons } from "@/components/dashboard/exportar-buttons";
import { TopProdutos } from "@/components/dashboard/top-produtos";
import { DesempenhoVendedores } from "@/components/dashboard/desempenho-vendedores";

export const metadata: Metadata = { title: "Dashboard — Loja Revoada" };

function resolverPeriodo(searchParams: { inicio?: string; fim?: string }): Periodo {
  const padrao = periodoPadrao();
  const inicio = searchParams.inicio || padrao.inicio;
  const fim = searchParams.fim || padrao.fim;
  // Evita período invertido caso o link de exportação seja editado à mão.
  return inicio <= fim ? { inicio, fim } : { inicio: fim, fim: inicio };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>;
}) {
  const periodo = resolverPeriodo(await searchParams);

  const [metricas, produtos, vendedores] = await Promise.all([
    obterMetricasTempoReal(),
    listarTopProdutos(periodo),
    listarDesempenhoVendedores(periodo),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Faturamento, ranking de produtos e desempenho dos vendedores.
          </p>
        </div>
        <RealtimeWatcher />
      </div>

      <MetricasCards metricas={metricas} />

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
        <PeriodoForm periodo={periodo} />
        <ExportarButtons periodo={periodo} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopProdutos produtos={produtos} />
        <DesempenhoVendedores vendedores={vendedores} />
      </div>
    </div>
  );
}
