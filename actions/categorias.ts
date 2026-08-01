"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import { categoriaSchema, type CategoriaInput } from "@/lib/validations/estoque";

export type Categoria = {
  id: string;
  nome: string;
  descricao: string | null;
};

export async function listarCategorias(): Promise<Categoria[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select("id, nome, descricao")
    .order("nome");

  return data ?? [];
}

export async function criarCategoria(input: CategoriaInput): Promise<{ error?: string }> {
  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar categorias" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").insert({
    nome: parsed.data.nome,
    descricao: parsed.data.descricao || null,
  });

  if (error) {
    const duplicada = error.message.toLowerCase().includes("duplicate");
    return { error: duplicada ? "Já existe uma categoria com esse nome" : "Não foi possível criar a categoria" };
  }

  revalidatePath("/estoque");
  return {};
}

export async function excluirCategoria(id: string): Promise<{ error?: string }> {
  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar categorias" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").delete().eq("id", id);

  if (error) {
    return { error: "Não é possível excluir: existem produtos usando essa categoria" };
  }

  revalidatePath("/estoque");
  return {};
}
