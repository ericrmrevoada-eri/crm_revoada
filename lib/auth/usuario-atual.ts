import "server-only";
import { createClient } from "@/lib/supabase/server";

export type UsuarioAtual = {
  id: string;
  nome: string;
  papel: "admin" | "vendedor";
};

// Contraparte de assertIsAdmin() para as ações que vendedor E admin executam
// (PDV, caixa próprio). Reconfirma no servidor que a conta existe e está ativa —
// o proxy.ts já derruba conta desativada, mas Server Action nunca confia na rota.
export async function obterUsuarioAtual(): Promise<UsuarioAtual> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome_completo, papel, ativo")
    .eq("id", user.id)
    .single();

  if (!profile?.ativo) throw new Error("Conta inativa");

  return { id: user.id, nome: profile.nome_completo, papel: profile.papel };
}
