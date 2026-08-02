"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/auth/usuario-atual";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import { traduzirErroBanco } from "@/lib/supabase/erros";
import { paraNumeroDecimal } from "@/lib/validations/comum";
import {
  abrirCaixaSchema,
  fecharCaixaSchema,
  movimentacaoCaixaSchema,
  type AbrirCaixaInput,
  type FecharCaixaInput,
  type MovimentacaoCaixaInput,
} from "@/lib/validations/financeiro";

export type Caixa = {
  id: string;
  vendedor_id: string;
  vendedor_nome: string | null;
  data_abertura: string;
  valor_abertura: number;
  data_fechamento: string | null;
  valor_fechamento_informado: number | null;
  valor_fechamento_calculado: number | null;
  status: "aberto" | "fechado";
};

export type ResumoCaixa = {
  caixa_id: string;
  valor_abertura: number;
  vendas_dinheiro: number;
  vendas_outras: number;
  suprimentos: number;
  sangrias: number;
  despesas: number;
  valor_calculado: number;
};

export type MovimentacaoCaixa = {
  id: string;
  tipo: "sangria" | "suprimento" | "venda" | "despesa";
  valor: number;
  descricao: string | null;
  criado_em: string;
  forma_pagamento: string | null;
};

export async function obterCaixaAberto(): Promise<Caixa | null> {
  const usuario = await obterUsuarioAtual();
  const supabase = await createClient();

  const { data } = await supabase
    .from("caixas")
    .select("*")
    .eq("vendedor_id", usuario.id)
    .eq("status", "aberto")
    .maybeSingle();

  if (!data) return null;
  return { ...data, vendedor_nome: usuario.nome };
}

export async function obterResumoCaixa(caixaId: string): Promise<ResumoCaixa | null> {
  await obterUsuarioAtual();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("resumo_caixa", { p_caixa_id: caixaId });
  if (error || !data) return null;

  return data as unknown as ResumoCaixa;
}

export async function listarMovimentacoes(caixaId: string): Promise<MovimentacaoCaixa[]> {
  await obterUsuarioAtual();
  const supabase = await createClient();

  // RLS já limita o vendedor às movimentações do próprio caixa.
  const { data } = await supabase
    .from("movimentacoes_caixa")
    .select("id, tipo, valor, descricao, criado_em, forma_pagamento")
    .eq("caixa_id", caixaId)
    .order("criado_em", { ascending: false });

  return data ?? [];
}

export async function abrirCaixa(input: AbrirCaixaInput): Promise<{ error?: string }> {
  const parsed = abrirCaixaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const valor = paraNumeroDecimal(parsed.data.valorAbertura);
  if (valor < 0) return { error: "O valor de abertura não pode ser negativo" };

  let usuario;
  try {
    usuario = await obterUsuarioAtual();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("caixas")
    .insert({ vendedor_id: usuario.id, valor_abertura: valor });

  if (error) {
    // O índice único uniq_caixa_aberto_por_vendedor é a garantia real de que não
    // existem dois caixas abertos ao mesmo tempo, mesmo com dois cliques rápidos.
    if (error.code === "23505") {
      return { error: "Você já tem um caixa aberto" };
    }
    return { error: "Não foi possível abrir o caixa" };
  }

  revalidatePath("/pdv");
  revalidatePath("/financeiro");
  return {};
}

export async function registrarMovimentacao(
  caixaId: string,
  input: MovimentacaoCaixaInput,
): Promise<{ error?: string }> {
  const parsed = movimentacaoCaixaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await obterUsuarioAtual();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();

  const { data: caixa } = await supabase
    .from("caixas")
    .select("status")
    .eq("id", caixaId)
    .maybeSingle();

  if (!caixa) return { error: "Caixa não encontrado" };
  if (caixa.status === "fechado") return { error: "Este caixa já foi fechado" };

  const { error } = await supabase.from("movimentacoes_caixa").insert({
    caixa_id: caixaId,
    tipo: parsed.data.tipo,
    valor: paraNumeroDecimal(parsed.data.valor),
    descricao: parsed.data.descricao?.trim() || null,
  });

  if (error) {
    return { error: "Não foi possível registrar a movimentação" };
  }

  revalidatePath("/pdv");
  revalidatePath("/financeiro");
  return {};
}

export async function fecharCaixa(
  caixaId: string,
  input: FecharCaixaInput,
): Promise<{ error?: string; resumo?: ResumoCaixa & { valor_informado: number; diferenca: number } }> {
  const parsed = fecharCaixaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await obterUsuarioAtual();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fechar_caixa", {
    p_caixa_id: caixaId,
    p_valor_informado: paraNumeroDecimal(parsed.data.valorInformado),
  });

  if (error) {
    return { error: traduzirErroBanco(error, "Não foi possível fechar o caixa") };
  }

  revalidatePath("/pdv");
  revalidatePath("/financeiro");
  return { resumo: data as unknown as ResumoCaixa & { valor_informado: number; diferenca: number } };
}

// Visão do admin: todos os caixas, de todos os vendedores.
export async function listarCaixas(): Promise<Caixa[]> {
  await assertIsAdmin();
  const supabase = await createClient();

  const [{ data: caixas, error: errorCaixas }, { data: perfis, error: errorPerfis }] =
    await Promise.all([
      supabase.from("caixas").select("*").order("data_abertura", { ascending: false }),
      supabase.from("profiles").select("id, nome_completo"),
    ]);
  if (errorCaixas || errorPerfis) throw new Error("Não foi possível carregar os caixas.");

  const nomes = new Map(perfis.map((p) => [p.id, p.nome_completo]));

  return caixas.map((c) => ({
    ...c,
    vendedor_nome: nomes.get(c.vendedor_id) ?? null,
  }));
}
