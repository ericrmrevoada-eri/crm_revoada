"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import { fornecedorSchema, type FornecedorInput } from "@/lib/validations/estoque";

export type Fornecedor = {
  id: string;
  nome: string;
  telefone: string | null;
  observacoes: string | null;
};

export async function listarFornecedores(): Promise<Fornecedor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fornecedores")
    .select("id, nome, telefone, observacoes")
    .order("nome");

  return data ?? [];
}

export async function criarFornecedor(input: FornecedorInput): Promise<{ error?: string }> {
  const parsed = fornecedorSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar fornecedores" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fornecedores").insert({
    nome: parsed.data.nome,
    telefone: parsed.data.telefone || null,
    observacoes: parsed.data.observacoes || null,
  });

  if (error) {
    return { error: "Não foi possível criar o fornecedor" };
  }

  revalidatePath("/estoque");
  return {};
}

export async function excluirFornecedor(id: string): Promise<{ error?: string }> {
  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar fornecedores" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fornecedores").delete().eq("id", id);

  if (error) {
    return { error: "Não é possível excluir: existem produtos usando esse fornecedor" };
  }

  revalidatePath("/estoque");
  return {};
}
