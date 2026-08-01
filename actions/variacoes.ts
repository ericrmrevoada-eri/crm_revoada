"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import { uploadFotoProduto } from "@/lib/supabase/storage";
import { variacaoSchema, paraNumeroInteiro, type VariacaoInput } from "@/lib/validations/estoque";

export type Variacao = {
  id: string;
  produto_id: string;
  tamanho: string;
  cor: string;
  quantidade_estoque: number;
  estoque_minimo: number;
  foto_url: string | null;
};

export async function contarVariacoesAbaixoMinimo(): Promise<number> {
  await assertIsAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("variacoes_produto")
    .select("quantidade_estoque, estoque_minimo");

  return (data ?? []).filter((v) => v.quantidade_estoque <= v.estoque_minimo).length;
}

export async function listarVariacoes(produtoId: string): Promise<Variacao[]> {
  await assertIsAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("variacoes_produto")
    .select("id, produto_id, tamanho, cor, quantidade_estoque, estoque_minimo, foto_url")
    .eq("produto_id", produtoId)
    .order("tamanho");

  return data ?? [];
}

export async function criarVariacao(
  produtoId: string,
  input: VariacaoInput,
  foto?: File | null,
): Promise<{ error?: string }> {
  const parsed = variacaoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar variações" };
  }

  const supabase = await createClient();
  const quantidadeInicial = paraNumeroInteiro(parsed.data.quantidadeEstoque);

  let fotoUrl: string | null = null;
  if (foto && foto.size > 0) {
    const resultado = await uploadFotoProduto(supabase, foto);
    if (resultado.error) return { error: resultado.error };
    fotoUrl = resultado.url ?? null;
  }

  // A variação nasce com estoque 0; se houver quantidade inicial, ela entra
  // como uma entrada de estoque de verdade (não escrita direto na coluna),
  // para o trigger aplicar_entrada_estoque somar e o histórico de entradas
  // (aba "Entradas de estoque") não ficar com um número sem origem registrada.
  const { data: variacao, error } = await supabase
    .from("variacoes_produto")
    .insert({
      produto_id: produtoId,
      tamanho: parsed.data.tamanho,
      cor: parsed.data.cor,
      quantidade_estoque: 0,
      estoque_minimo: paraNumeroInteiro(parsed.data.estoqueMinimo),
      foto_url: fotoUrl,
    })
    .select("id")
    .single();

  if (error || !variacao) {
    const duplicada = (error?.message ?? "").toLowerCase().includes("duplicate");
    return {
      error: duplicada
        ? "Já existe essa variação (tamanho/cor) para este produto"
        : "Não foi possível criar a variação",
    };
  }

  if (quantidadeInicial > 0) {
    const { error: erroEntrada } = await supabase.from("entradas_estoque").insert({
      variacao_produto_id: variacao.id,
      quantidade: quantidadeInicial,
      lote: "Estoque inicial",
    });
    if (erroEntrada) {
      return { error: "Variação criada, mas não foi possível registrar o estoque inicial" };
    }
  }

  revalidatePath("/estoque");
  return {};
}

export async function atualizarVariacao(
  id: string,
  input: VariacaoInput,
): Promise<{ error?: string }> {
  const parsed = variacaoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar variações" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("variacoes_produto")
    .update({
      tamanho: parsed.data.tamanho,
      cor: parsed.data.cor,
      quantidade_estoque: paraNumeroInteiro(parsed.data.quantidadeEstoque),
      estoque_minimo: paraNumeroInteiro(parsed.data.estoqueMinimo),
    })
    .eq("id", id);

  if (error) {
    return { error: "Não foi possível atualizar a variação" };
  }

  revalidatePath("/estoque");
  return {};
}

// Troca só a foto de uma variação já existente — ex: a variação preta ficou
// com a mesma foto da branca por engano, ou a foto do produto não representa
// bem essa cor específica no PDV.
export async function atualizarFotoVariacao(
  id: string,
  foto: File,
): Promise<{ error?: string }> {
  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar variações" };
  }

  if (!foto || foto.size === 0) {
    return { error: "Selecione uma foto" };
  }

  const supabase = await createClient();
  const resultado = await uploadFotoProduto(supabase, foto);
  if (resultado.error) return { error: resultado.error };

  const { error } = await supabase
    .from("variacoes_produto")
    .update({ foto_url: resultado.url })
    .eq("id", id);

  if (error) {
    return { error: "Não foi possível atualizar a foto da variação" };
  }

  revalidatePath("/estoque");
  return {};
}

export async function excluirVariacao(id: string): Promise<{ error?: string }> {
  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar variações" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("variacoes_produto").delete().eq("id", id);

  if (error) {
    return { error: "Não é possível excluir: já existem vendas registradas com essa variação" };
  }

  revalidatePath("/estoque");
  return {};
}
