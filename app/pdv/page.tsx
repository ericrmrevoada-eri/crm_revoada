import type { Metadata } from "next";
import {
  listarMovimentacoes,
  obterCaixaAberto,
  obterResumoCaixa,
} from "@/actions/caixa";
import { listarCatalogoPdv, listarMinhasVendas } from "@/actions/vendas";
import { PdvShell } from "@/components/pdv/pdv-shell";

export const metadata: Metadata = { title: "PDV — Loja Revoada" };

export default async function PdvPage() {
  const caixa = await obterCaixaAberto();

  // Sem caixa aberto o PDV não carrega catálogo nenhum: a regra vale para
  // vendedor e admin, e é reforçada de novo dentro de registrar_venda no banco.
  const [catalogo, resumo, movimentacoes, vendas] = caixa
    ? await Promise.all([
        listarCatalogoPdv(),
        obterResumoCaixa(caixa.id),
        listarMovimentacoes(caixa.id),
        listarMinhasVendas(10),
      ])
    : [[], null, [], []];

  return (
    <PdvShell
      caixa={caixa}
      resumo={resumo}
      movimentacoes={movimentacoes}
      catalogo={catalogo}
      vendas={vendas}
    />
  );
}
