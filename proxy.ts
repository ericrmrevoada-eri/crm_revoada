import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/login", "/esqueci-senha", "/redefinir-senha", "/auth/confirm"];
const ADMIN_ROUTES = ["/dashboard", "/vendedores", "/estoque", "/financeiro"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
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

  // Autenticado tentando acessar login/recuperação de senha -> manda pra área dele.
  if (isPublicRoute(pathname)) {
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
