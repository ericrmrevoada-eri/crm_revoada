import type { Metadata } from "next";
import { listarCaixas, obterCaixaAberto } from "@/actions/caixa";
import { listarDespesas, obterResumoFinanceiro } from "@/actions/despesas";
import { listarVendas } from "@/actions/vendas";
import { ResumoFinanceiroCards } from "@/components/financeiro/resumo-financeiro";
import { DespesaForm } from "@/components/financeiro/despesa-form";
import { DespesasTable } from "@/components/financeiro/despesas-table";
import { CaixasTable } from "@/components/financeiro/caixas-table";
import { VendasTable } from "@/components/financeiro/vendas-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Financeiro — Loja Revoada" };

export default async function FinanceiroPage() {
  const [resumo, caixas, despesas, vendas, caixaAberto] = await Promise.all([
    obterResumoFinanceiro(),
    listarCaixas(),
    listarDespesas(),
    listarVendas(),
    obterCaixaAberto(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Caixas dos vendedores, despesas operacionais e resumo de entradas x saídas.
          </p>
        </div>
        <DespesaForm caixaAbertoId={caixaAberto?.id ?? null} />
      </div>

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="caixas">Caixas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo">
          <ResumoFinanceiroCards resumo={resumo} />
        </TabsContent>
        <TabsContent value="caixas">
          <CaixasTable caixas={caixas} />
        </TabsContent>
        <TabsContent value="despesas">
          <DespesasTable despesas={despesas} />
        </TabsContent>
        <TabsContent value="vendas">
          <VendasTable vendas={vendas} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
