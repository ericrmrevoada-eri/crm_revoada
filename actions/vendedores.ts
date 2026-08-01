"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import { novoVendedorSchema, type NovoVendedorInput } from "@/lib/validations/auth";

export type Vendedor = {
  id: string;
  nome_completo: string;
  telefone: string | null;
  ativo: boolean;
  created_at: string;
};

export async function listarVendedores(): Promise<Vendedor[]> {
  await assertIsAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nome_completo, telefone, ativo, created_at")
    .eq("papel", "vendedor")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function criarVendedor(
  input: NovoVendedorInput,
): Promise<{ error?: string }> {
  const parsed = novoVendedorSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem cadastrar vendedores" };
  }

  // Criar auth.users exige a Admin API (service_role) — só roda no servidor.
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (error || !data.user) {
    const jaExiste = error?.message.toLowerCase().includes("already");
    return {
      error: jaExiste
        ? "Já existe um usuário cadastrado com esse e-mail"
        : "Não foi possível criar o vendedor",
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    nome_completo: parsed.data.nomeCompleto,
    telefone: parsed.data.telefone || null,
    papel: "vendedor",
  });

  if (profileError) {
    // Reverte o usuário de auth criado já que o perfil não pôde ser salvo.
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Não foi possível salvar os dados do vendedor" };
  }

  revalidatePath("/vendedores");
  return {};
}

export async function alternarAtivoVendedor(
  id: string,
  ativo: boolean,
): Promise<{ error?: string }> {
  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem gerenciar vendedores" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ ativo }).eq("id", id);

  if (error) {
    return { error: "Não foi possível atualizar o vendedor" };
  }

  revalidatePath("/vendedores");
  return {};
}
