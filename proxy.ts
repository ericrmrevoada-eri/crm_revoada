import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/login", "/esqueci-senha", "/redefinir-senha", "/auth/confirm"];
// Só estas duas fazem sentido apenas para quem NÃO está logado: redirecionam
// para a área do usuário se ele já estiver autenticado. /redefinir-senha e
// /auth/confirm são diferentes — alcançá-las já implica uma recuperação de
// senha ou confirmação de e-mail em andamento (o link de recuperação
// autentica a sessão antes de chegar em /redefinir-senha), então nunca devem
// desviar o usuário de volta pra home, senão a troca de senha nunca completa.
const AUTH_ENTRY_ROUTES = ["/login", "/esqueci-senha"];
const ADMIN_ROUTES = ["/dashboard", "/vendedores", "/estoque", "/financeiro"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isAuthEntryRoute(pathname: string) {
  return AUTH_ENTRY_ROUTES.some((route) => pathname.startsWith(route));
}

function isAdminRoute(pathname: string) {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user) {
    if (isPublicRoute(pathname)) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel, ativo")
    .eq("id", user.id)
    .single();

  // Conta desativada pelo admin durante uma sessão já aberta -> derruba na hora.
  if (profile && !profile.ativo) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const home = profile?.papel === "admin" ? "/dashboard" : "/pdv";

  // Autenticado tentando acessar login/esqueci-senha -> manda pra área dele.
  if (isAuthEntryRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  // Vendedor tentando acessar rota de admin -> bloqueado, volta pro PDV.
  if (profile?.papel !== "admin" && isAdminRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/pdv";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
