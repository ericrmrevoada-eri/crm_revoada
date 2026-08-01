"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import { produtoSchema, paraNumeroDecimal, type ProdutoInput } from "@/lib/validations/estoque";

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string | null;
  categoria_nome: string | null;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  marca: string | null;
  preco_custo: number;
  preco_venda: number;
  foto_url: string | null;
  ativo: boolean;
  total_variacoes: number;
  variacoes_abaixo_minimo: number;
};

export async function listarProdutos(): Promise<Produto[]> {
  await assertIsAdmin();
  const supabase = await createClient();

  const [{ data: produtos }, { data: categorias }, { data: fornecedores }, { data: variacoes }] =
    await Promise.all([
      supabase.from("produtos").select("*").order("nome"),
      supabase.from("categorias").select("id, nome"),
      supabase.from("fornecedores").select("id, nome"),
      supabase.from("variacoes_produto").select("produto_id, quantidade_estoque, estoque_minimo"),
    ]);

  const categoriaMap = new Map((categorias ?? []).map((c) => [c.id, c.nome]));
  const fornecedorMap = new Map((fornecedores ?? []).map((f) => [f.id, f.nome]));

  return (produtos ?? []).map((p) => {
    const vs = (variacoes ?? []).filter((v) => v.produto_id === p.id);
    return {
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      categoria_id: p.categoria_id,
      categoria_nome: p.categoria_id ? (categoriaMap.get(p.categoria_id) ?? null) : null,
      fornecedor_id: p.fornecedor_id,
      fornecedor_nome: p.fornecedor_id ? (fornecedorMap.get(p.fornecedor_id) ?? null) : null,
      marca: p.marca,
      preco_custo: p.preco_custo,
      preco_venda: p.preco_venda,
      foto_url: p.foto_url,
      ativo: p.ativo,
      total_variacoes: vs.length,
      variacoes_abaixo_minimo: vs.filter((v) => v.quantidade_estoque <= v.estoque_minimo).length,
    };
  });
}

async function uploadFoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  foto: File,
): Promise<{ url?: string; error?: string }> {
  const extensao = foto.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${extensao}`;
  const { error } = await supabase.storage.from("produtos").upload(path, foto);
  if (error) return { error: "Não foi possível enviar a foto do produto" };
  const { data } = supabase.storage.from("produtos").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function criarProduto(
  input: ProdutoInput,
  foto?: File | null,
): Promise<{ error?: string }> {
  const parsed = produtoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar produtos" };
  }

  const supabase = await createClient();

  let fotoUrl: string | null = null;
  if (foto && foto.size > 0) {
    const resultado = await uploadFoto(supabase, foto);
    if (resultado.error) return { error: resultado.error };
    fotoUrl = resultado.url ?? null;
  }

  const { error } = await supabase.from("produtos").insert({
    nome: parsed.data.nome,
    descricao: parsed.data.descricao || null,
    categoria_id: parsed.data.categoriaId || null,
    fornecedor_id: parsed.data.fornecedorId || null,
    marca: parsed.data.marca || null,
    preco_custo: paraNumeroDecimal(parsed.data.precoCusto),
    preco_venda: paraNumeroDecimal(parsed.data.precoVenda),
    ativo: parsed.data.ativo,
    foto_url: fotoUrl,
  });

  if (error) {
    return { error: "Não foi possível criar o produto" };
  }

  revalidatePath("/estoque");
  return {};
}

export async function atualizarProduto(
  id: string,
  input: ProdutoInput,
  foto?: File | null,
): Promise<{ error?: string }> {
  const parsed = produtoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar produtos" };
  }

  const supabase = await createClient();

  let fotoUrl: string | undefined;
  if (foto && foto.size > 0) {
    const resultado = await uploadFoto(supabase, foto);
    if (resultado.error) return { error: resultado.error };
    fotoUrl = resultado.url;
  }

  const { error } = await supabase
    .from("produtos")
    .update({
      nome: parsed.data.nome,
      descricao: parsed.data.descricao || null,
      categoria_id: parsed.data.categoriaId || null,
      fornecedor_id: parsed.data.fornecedorId || null,
      marca: parsed.data.marca || null,
      preco_custo: paraNumeroDecimal(parsed.data.precoCusto),
      preco_venda: paraNumeroDecimal(parsed.data.precoVenda),
      ativo: parsed.data.ativo,
      ...(fotoUrl ? { foto_url: fotoUrl } : {}),
    })
    .eq("id", id);

  if (error) {
    return { error: "Não foi possível atualizar o produto" };
  }

  revalidatePath("/estoque");
  return {};
}

export async function alternarAtivoProduto(id: string, ativo: boolean): Promise<{ error?: string }> {
  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar produtos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("produtos").update({ ativo }).eq("id", id);

  if (error) {
    return { error: "Não foi possível atualizar o produto" };
  }

  revalidatePath("/estoque");
  return {};
}
