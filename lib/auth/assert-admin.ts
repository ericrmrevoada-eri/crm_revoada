import "server-only";
import { createClient } from "@/lib/supabase/server";

// Reconfirma no servidor que quem está chamando é admin — nunca confia só na
// checagem de UI/rota do proxy.ts. Usado por toda Server Action restrita a admin.
export async function assertIsAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (profile?.papel !== "admin") {
    throw new Error("Apenas administradores podem realizar esta ação");
  }
}
