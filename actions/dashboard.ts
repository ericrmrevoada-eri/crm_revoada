"use server";

import { createClient } from "@/lib/supabase/server";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import { obterResumoFinanceiro } from "@/actions/despesas";
import { fimDoPeriodo, inicioDoPeriodo, type Periodo } from "@/lib/dashboard/periodo";

export type MetricasTempoReal = {
  hoje: { faturamento: number; ticketMedio: number; pecas: number; vendas: number };
  mes: { faturamento: number; ticketMedio: number; pecas: number; vendas: number };
};

export type TopProduto = {
  produtoId: string;
  nome: string;
  marca: string | null;
  quantidade: number;
  valorTotal: number;
};

export type DesempenhoVendedor = {
  vendedorId: string;
  nome: string;
  vendas: number;
  pecas: number;
  faturamento: number;
  ticketMedio: number;
};

export type VendaExportacao = {
  id: string;
  criadoEm: string;
  vendedorNome: string;
  formaPagamento: string;
  pecas: number;
  desconto: number;
  valorTotal: number;
  status: "concluida" | "cancelada";
};

export type ResumoPeriodoSimples = {
  faturamento: number;
  vendas: number;
  pecas: number;
  ticketMedio: number;
};

// Cards do topo do dashboard: faturamento hoje/mês, ticket médio, peças vendidas.
// Reaproveita a mesma consulta do resumo financeiro (só recorta os campos que
// interessam aqui) para não ter duas fontes de verdade sobre faturamento.
export async function obterMetricasTempoReal(): Promise<MetricasTempoReal> {
  const resumo = await obterResumoFinanceiro();
  return {
    hoje: {
      faturamento: resumo.hoje.faturamento,
      ticketMedio: resumo.hoje.ticket_medio,
      pecas: resumo.hoje.pecas,
      vendas: resumo.hoje.vendas,
    },
    mes: {
      faturamento: resumo.mes.faturamento,
      ticketMedio: resumo.mes.ticket_medio,
      pecas: resumo.mes.pecas,
      vendas: resumo.mes.vendas,
    },
  };
}

export async function listarTopProdutos(periodo: Periodo, limite = 10): Promise<TopProduto[]> {
  await assertIsAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("itens_venda")
    .select(
      "quantidade, subtotal, variacoes_produto!inner(produto_id, produtos!inner(nome, marca)), vendas!inner(status, criado_em)",
    )
    .eq("vendas.status", "concluida")
    .gte("vendas.criado_em", inicioDoPeriodo(periodo))
    .lte("vendas.criado_em", fimDoPeriodo(periodo));

  const porProduto = new Map<string, TopProduto>();
  for (const item of data ?? []) {
    const produto = item.variacoes_produto.produtos;
    const produtoId = item.variacoes_produto.produto_id;
    const atual = porProduto.get(produtoId) ?? {
      produtoId,
      nome: produto.nome,
      marca: produto.marca,
      quantidade: 0,
      valorTotal: 0,
    };
    atual.quantidade += item.quantidade;
    atual.valorTotal = Math.round((atual.valorTotal + item.subtotal) * 100) / 100;
    porProduto.set(produtoId, atual);
  }

  return Array.from(porProduto.values())
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, limite);
}

export async function listarDesempenhoVendedores(periodo: Periodo): Promise<DesempenhoVendedor[]> {
  await assertIsAdmin();
  const supabase = await createClient();

  const [{ data: vendas }, { data: perfis }] = await Promise.all([
    supabase
      .from("vendas")
      .select("vendedor_id, valor_total, itens_venda(quantidade)")
      .eq("status", "concluida")
      .gte("criado_em", inicioDoPeriodo(periodo))
      .lte("criado_em", fimDoPeriodo(periodo)),
    supabase.from("profiles").select("id, nome_completo"),
  ]);

  const nomes = new Map((perfis ?? []).map((p) => [p.id, p.nome_completo]));
  const porVendedor = new Map<string, DesempenhoVendedor>();

  for (const venda of vendas ?? []) {
    const pecas = (venda.itens_venda ?? []).reduce((acc, i) => acc + i.quantidade, 0);
    const atual = porVendedor.get(venda.vendedor_id) ?? {
      vendedorId: venda.vendedor_id,
      nome: nomes.get(venda.vendedor_id) ?? "—",
      vendas: 0,
      pecas: 0,
      faturamento: 0,
      ticketMedio: 0,
    };
    atual.vendas += 1;
    atual.pecas += pecas;
    atual.faturamento = Math.round((atual.faturamento + venda.valor_total) * 100) / 100;
    porVendedor.set(venda.vendedor_id, atual);
  }

  return Array.from(porVendedor.values())
    .map((v) => ({ ...v, ticketMedio: v.vendas > 0 ? Math.round((v.faturamento / v.vendas) * 100) / 100 : 0 }))
    .sort((a, b) => b.faturamento - a.faturamento);
}

// Lista detalhada usada pela exportação (CSV/PDF) — inclui canceladas, para o
// relatório do período refletir o que realmente aconteceu no caixa, não só o
// faturamento líquido.
export async function listarVendasParaExportacao(periodo: Periodo): Promise<VendaExportacao[]> {
  await assertIsAdmin();
  const supabase = await createClient();

  const [{ data: vendas }, { data: perfis }] = await Promise.all([
    supabase
      .from("vendas")
      .select("id, criado_em, vendedor_id, status, forma_pagamento, valor_total, desconto, itens_venda(quantidade)")
      .gte("criado_em", inicioDoPeriodo(periodo))
      .lte("criado_em", fimDoPeriodo(periodo))
      .order("criado_em"),
    supabase.from("profiles").select("id, nome_completo"),
  ]);

  const nomes = new Map((perfis ?? []).map((p) => [p.id, p.nome_completo]));

  return (vendas ?? []).map((v) => ({
    id: v.id,
    criadoEm: v.criado_em,
    vendedorNome: nomes.get(v.vendedor_id) ?? "—",
    formaPagamento: v.forma_pagamento,
    pecas: (v.itens_venda ?? []).reduce((acc, i) => acc + i.quantidade, 0),
    desconto: v.desconto,
    valorTotal: v.valor_total,
    status: v.status,
  }));
}

// Totais do período selecionado (diferente dos cards fixos hoje/mês do topo do
// dashboard) — é o que aparece no cabeçalho do relatório exportado.
export async function obterResumoPeriodo(periodo: Periodo): Promise<ResumoPeriodoSimples> {
  await assertIsAdmin();
  const supabase = await createClient();

  const { data: vendas } = await supabase
    .from("vendas")
    .select("valor_total, itens_venda(quantidade)")
    .eq("status", "concluida")
    .gte("criado_em", inicioDoPeriodo(periodo))
    .lte("criado_em", fimDoPeriodo(periodo));

  const faturamento =
    Math.round((vendas ?? []).reduce((acc, v) => acc + v.valor_total, 0) * 100) / 100;
  const pecas = (vendas ?? []).reduce(
    (acc, v) => acc + (v.itens_venda ?? []).reduce((a, i) => a + i.quantidade, 0),
    0,
  );
  const totalVendas = vendas?.length ?? 0;

  return {
    faturamento,
    vendas: totalVendas,
    pecas,
    ticketMedio: totalVendas > 0 ? Math.round((faturamento / totalVendas) * 100) / 100 : 0,
  };
}
