import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Resolve o valor recebido contra a origem da requisição e devolve apenas o
// caminho, se ele provar ser interno. Qualquer outro caso cai em "/".
function internalPathOrRoot(rawNext: string, origin: string): string {
  if (!rawNext.startsWith("/")) return "/";

  let resolved: URL;
  try {
    resolved = new URL(rawNext, origin);
  } catch {
    return "/";
  }
  if (resolved.origin !== origin) return "/";

  // O Location sai sempre como caminho relativo de uma única barra, então o
  // browser só pode resolvê-lo na própria origem. A conferência do caminho já
  // serializado é necessária: "/.//site-malicioso.com" resolve na origem certa,
  // mas serializa como "//site-malicioso.com", que é protocol-relative.
  const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  if (!path.startsWith("/") || path[1] === "/" || path[1] === "\\") return "/";

  return path;
}

// Link enviado por e-mail (recuperação de senha) cai aqui: troca o token pela
// sessão e manda o usuário para a página indicada em `next`.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // "next" vem da query string de um link de e-mail, então precisa ser provado
  // interno antes de virar redirect: exigimos caminho relativo e comparamos a
  // origem depois de resolver. Testar "uma barra, não duas" não bastava — no
  // parser de URL a barra invertida vale como barra, então "?next=%2F%5C" mais
  // um domínio ("/\site-malicioso.com") passava pelo regex e o browser
  // resolvia o Location como "https://site-malicioso.com/".
  const rawNext = searchParams.get("next") ?? "/";
  const next = internalPathOrRoot(rawNext, request.nextUrl.origin);

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?erro=link-invalido");
}
