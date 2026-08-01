import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { listarProdutos } from "@/actions/produtos";
import { listarCategorias } from "@/actions/categorias";
import { listarFornecedores } from "@/actions/fornecedores";
import { listarEntradas } from "@/actions/entradas-estoque";
import { ProdutoForm } from "@/components/admin/produto-form";
import { ProdutosTable } from "@/components/admin/produtos-table";
import { CategoriaFornecedorManager } from "@/components/admin/categoria-fornecedor-manager";
import { EntradasTable } from "@/components/admin/entradas-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Estoque — Loja Revoada" };

export default async function EstoquePage() {
  const [produtos, categorias, fornecedores, entradas] = await Promise.all([
    listarProdutos(),
    listarCategorias(),
    listarFornecedores(),
    listarEntradas(),
  ]);

  const totalBaixoEstoque = produtos.reduce((acc, p) => acc + p.variacoes_abaixo_minimo, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            Produtos, variações por tamanho/cor e entradas de mercadoria.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CategoriaFornecedorManager categorias={categorias} fornecedores={fornecedores} />
          <ProdutoForm categorias={categorias} fornecedores={fornecedores} />
        </div>
      </div>

      {totalBaixoEstoque > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {totalBaixoEstoque} variação(ões) abaixo do estoque mínimo. Confira na aba Produtos.
        </div>
      )}

      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="entradas">Entradas de estoque</TabsTrigger>
        </TabsList>
        <TabsContent value="produtos">
          <ProdutosTable produtos={produtos} categorias={categorias} fornecedores={fornecedores} />
        </TabsContent>
        <TabsContent value="entradas">
          <EntradasTable entradas={entradas} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
