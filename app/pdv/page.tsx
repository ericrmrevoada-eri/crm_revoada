import type { Metadata } from "next";
import {
  listarMovimentacoes,
  obterCaixaAberto,
  obterResumoCaixa,
} from "@/actions/caixa";
import { listarCatalogoPdv, listarMinhasVendas } from "@/actions/vendas";
import { AbrirCaixaCard } from "@/components/pdv/abrir-caixa-card";
import { CaixaBar } from "@/components/pdv/caixa-bar";
import { PdvClient } from "@/components/pdv/pdv-client";
import { MinhasVendas } from "@/components/pdv/minhas-vendas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "PDV — Loja Revoada" };

export default async function PdvPage() {
  const caixa = await obterCaixaAberto();

  // Sem caixa aberto o PDV não carrega catálogo nenhum: a regra vale para
  // vendedor e admin, e é reforçada de novo dentro de registrar_venda no banco.
  if (!caixa) return <AbrirCaixaCard />;

  const [catalogo, resumo, movimentacoes, vendas] = await Promise.all([
    listarCatalogoPdv(),
    obterResumoCaixa(caixa.id),
    listarMovimentacoes(caixa.id),
    listarMinhasVendas(10),
  ]);

  return (
    <div className="space-y-4">
      <CaixaBar caixa={caixa} resumo={resumo} movimentacoes={movimentacoes} />

      <Tabs defaultValue="vender">
        <TabsList>
          <TabsTrigger value="vender">Vender</TabsTrigger>
          <TabsTrigger value="minhas-vendas">Minhas vendas</TabsTrigger>
        </TabsList>
        <TabsContent value="vender">
          <PdvClient catalogo={catalogo} />
        </TabsContent>
        <TabsContent value="minhas-vendas">
          <MinhasVendas vendas={vendas} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
