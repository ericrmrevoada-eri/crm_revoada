"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import {
  entradaEstoqueSchema,
  paraNumeroInteiro,
  type EntradaEstoqueInput,
} from "@/lib/validations/estoque";

export type EntradaEstoque = {
  id: string;
  quantidade: number;
  lote: string | null;
  data_entrada: string;
  produto_nome: string;
  variacao_tamanho: string;
  variacao_cor: string;
  fornecedor_nome: string | null;
};

export async function registrarEntrada(
  input: EntradaEstoqueInput,
): Promise<{ error?: string }> {
  const parsed = entradaEstoqueSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem registrar entradas de estoque" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("entradas_estoque").insert({
    variacao_produto_id: parsed.data.variacaoProdutoId,
    fornecedor_id: parsed.data.fornecedorId || null,
    quantidade: paraNumeroInteiro(parsed.data.quantidade),
    lote: parsed.data.lote || null,
    ...(parsed.data.dataEntrada ? { data_entrada: parsed.data.dataEntrada } : {}),
  });

  if (error) {
    return { error: "Não foi possível registrar a entrada" };
  }

  revalidatePath("/estoque");
  return {};
}

export async function listarEntradas(): Promise<EntradaEstoque[]> {
  await assertIsAdmin();
  const supabase = await createClient();

  const [{ data: entradas }, { data: variacoes }, { data: produtos }, { data: fornecedores }] =
    await Promise.all([
      supabase
        .from("entradas_estoque")
        .select("id, quantidade, lote, data_entrada, variacao_produto_id, fornecedor_id")
        .order("data_entrada", { ascending: false }),
      supabase.from("variacoes_produto").select("id, produto_id, tamanho, cor"),
      supabase.from("produtos").select("id, nome"),
      supabase.from("fornecedores").select("id, nome"),
    ]);

  const variacaoMap = new Map((variacoes ?? []).map((v) => [v.id, v]));
  const produtoMap = new Map((produtos ?? []).map((p) => [p.id, p.nome]));
  const fornecedorMap = new Map((fornecedores ?? []).map((f) => [f.id, f.nome]));

  return (entradas ?? []).map((e) => {
    const variacao = variacaoMap.get(e.variacao_produto_id);
    return {
      id: e.id,
      quantidade: e.quantidade,
      lote: e.lote,
      data_entrada: e.data_entrada,
      produto_nome: variacao ? (produtoMap.get(variacao.produto_id) ?? "—") : "—",
      variacao_tamanho: variacao?.tamanho ?? "—",
      variacao_cor: variacao?.cor ?? "—",
      fornecedor_nome: e.fornecedor_id ? (fornecedorMap.get(e.fornecedor_id) ?? null) : null,
    };
  });
}
