"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  esqueciSenhaSchema,
  loginSchema,
  redefinirSenhaSchema,
  type EsqueciSenhaInput,
  type LoginInput,
  type RedefinirSenhaInput,
} from "@/lib/validations/auth";

// Nunca deriva de x-forwarded-host/host: são cabeçalhos que quem faz a
// requisição controla. Um valor forjado aqui faria o e-mail de recuperação
// (enviado pelo próprio Supabase, de domínio legítimo) apontar pro domínio
// de um atacante.
function getOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL!;
}

export async function login(input: LoginInput): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "E-mail ou senha incorretos" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ativo")
    .eq("id", data.user.id)
    .single();

  if (profile && !profile.ativo) {
    await supabase.auth.signOut();
    return { error: "Este acesso foi desativado. Fale com o administrador." };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function esqueciSenha(
  input: EsqueciSenhaInput,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = esqueciSenhaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Informe um e-mail válido" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getOrigin()}/auth/confirm?next=/redefinir-senha`,
  });

  if (error) {
    return { error: "Não foi possível enviar o e-mail de recuperação" };
  }

  return { success: true };
}

export async function redefinirSenha(
  input: RedefinirSenhaInput,
): Promise<{ error?: string }> {
  const parsed = redefinirSenhaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: "Não foi possível redefinir a senha. Solicite um novo link." };
  }

  redirect("/");
}
