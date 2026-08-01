"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import { traduzirErroBanco } from "@/lib/supabase/erros";
import { paraNumeroDecimal } from "@/lib/validations/comum";
import { despesaSchema, type DespesaInput } from "@/lib/validations/financeiro";

export type Despesa = {
  id: string;
  categoria: "aluguel" | "frete" | "luz" | "outros";
  descricao: string | null;
  valor: number;
  data: string;
  criado_por_nome: string | null;
  pago_do_caixa: boolean;
};

export type ResumoPeriodo = {
  faturamento: number;
  despesas: number;
  saldo: number;
  vendas: number;
  pecas: number;
  ticket_medio: number;
  por_forma: Record<string, number>;
};

export type ResumoFinanceiro = {
  hoje: ResumoPeriodo;
  mes: ResumoPeriodo;
};

export async function listarDespesas(): Promise<Despesa[]> {
  await assertIsAdmin();
  const supabase = await createClient();

  const [{ data: despesas }, { data: perfis }, { data: movimentacoes }] = await Promise.all([
    supabase.from("despesas").select("*").order("data", { ascending: false }).limit(100),
    supabase.from("profiles").select("id, nome_completo"),
    supabase.from("movimentacoes_caixa").select("despesa_id").not("despesa_id", "is", null),
  ]);

  const nomes = new Map((perfis ?? []).map((p) => [p.id, p.nome_completo]));
  const pagasDoCaixa = new Set((movimentacoes ?? []).map((m) => m.despesa_id));

  return (despesas ?? []).map((d) => ({
    id: d.id,
    categoria: d.categoria,
    descricao: d.descricao,
    valor: d.valor,
    data: d.data,
    criado_por_nome: d.criado_por ? (nomes.get(d.criado_por) ?? null) : null,
    pago_do_caixa: pagasDoCaixa.has(d.id),
  }));
}

export async function registrarDespesa(
  input: DespesaInput,
  caixaId?: string | null,
): Promise<{ error?: string }> {
  const parsed = despesaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem lançar despesas" };
  }

  if (parsed.data.pagoDoCaixa && !caixaId) {
    return { error: "Não há caixa aberto para debitar a despesa" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_despesa", {
    p_categoria: parsed.data.categoria,
    p_valor: paraNumeroDecimal(parsed.data.valor),
    p_descricao: parsed.data.descricao?.trim() || undefined,
    p_data: parsed.data.data || undefined,
    p_caixa_id: parsed.data.pagoDoCaixa ? (caixaId ?? undefined) : undefined,
  });

  if (error) {
    return { error: traduzirErroBanco(error, "Não foi possível lançar a despesa") };
  }

  revalidatePath("/financeiro");
  revalidatePath("/pdv");
  revalidatePath("/dashboard");
  return {};
}

function periodoVazio(): ResumoPeriodo {
  return {
    faturamento: 0,
    despesas: 0,
    saldo: 0,
    vendas: 0,
    pecas: 0,
    ticket_medio: 0,
    por_forma: {},
  };
}

// Resumo de entradas x saídas do dia e do mês corrente. Só admin — vendedor não
// vê faturamento consolidado da loja.
export async function obterResumoFinanceiro(): Promise<ResumoFinanceiro> {
  await assertIsAdmin();
  const supabase = await createClient();

  const agora = new Date();
  const inicioDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioDoMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const dataInicioMes = inicioDoMes.toISOString().slice(0, 10);

  const [{ data: vendas }, { data: despesas }] = await Promise.all([
    supabase
      .from("vendas")
      .select("id, criado_em, valor_total, forma_pagamento, pagamentos_venda(forma_pagamento, valor), itens_venda(quantidade)")
      .eq("status", "concluida")
      .gte("criado_em", inicioDoMes.toISOString()),
    supabase.from("despesas").select("valor, data").gte("data", dataInicioMes),
  ]);

  const hoje = periodoVazio();
  const mes = periodoVazio();

  for (const venda of vendas ?? []) {
    const pecas = (venda.itens_venda ?? []).reduce((acc, i) => acc + i.quantidade, 0);
    const doDia = new Date(venda.criado_em) >= inicioDoDia;
    const alvos = doDia ? [hoje, mes] : [mes];

    for (const alvo of alvos) {
      alvo.faturamento += venda.valor_total;
      alvo.vendas += 1;
      alvo.pecas += pecas;
      for (const pagamento of venda.pagamentos_venda ?? []) {
        alvo.por_forma[pagamento.forma_pagamento] =
          (alvo.por_forma[pagamento.forma_pagamento] ?? 0) + pagamento.valor;
      }
    }
  }

  const dataHoje = inicioDoDia.toISOString().slice(0, 10);
  for (const despesa of despesas ?? []) {
    mes.despesas += despesa.valor;
    if (despesa.data === dataHoje) hoje.despesas += despesa.valor;
  }

  for (const periodo of [hoje, mes]) {
    periodo.faturamento = Math.round(periodo.faturamento * 100) / 100;
    periodo.despesas = Math.round(periodo.despesas * 100) / 100;
    periodo.saldo = Math.round((periodo.faturamento - periodo.despesas) * 100) / 100;
    periodo.ticket_medio =
      periodo.vendas > 0 ? Math.round((periodo.faturamento / periodo.vendas) * 100) / 100 : 0;
  }

  return { hoje, mes };
}
