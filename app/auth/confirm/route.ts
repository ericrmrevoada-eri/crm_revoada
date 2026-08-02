import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Link enviado por e-mail (recuperação de senha) cai aqui: troca o token pela
// sessão e manda o usuário para a página indicada em `next`.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Só aceita caminho relativo (uma barra, não duas): "next" vem da query
  // string de um link de e-mail, então "?next=https://site-malicioso.com" não
  // pode virar um redirect pra fora do domínio depois do login.
  const rawNext = searchParams.get("next") ?? "/";
  const next = /^\/(?!\/)/.test(rawNext) ? rawNext : "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?erro=link-invalido");
}
