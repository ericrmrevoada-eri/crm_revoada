import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarVariacoesAbaixoMinimo } from "@/actions/variacoes";
import { UserMenu } from "@/components/layout/user-menu";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function PdvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome_completo, papel")
    .eq("id", user.id)
    .single();

  // Admin também opera o PDV (Fase 4), mas continua precisando navegar para o
  // resto do painel — sem a barra lateral aqui ele ficava preso na tela do
  // PDV, sem como voltar para Dashboard/Estoque/Financeiro.
  if (profile?.papel === "admin") {
    const estoqueBaixoCount = await contarVariacoesAbaixoMinimo();
    return (
      <AdminShell nome={profile.nome_completo} papel="admin" estoqueBaixoCount={estoqueBaixoCount}>
        {children}
      </AdminShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <span className="font-heading text-lg font-bold uppercase tracking-wide text-gradient-neon">
          Revoada PDV
        </span>
        <UserMenu nome={profile?.nome_completo ?? "Vendedor"} papel={profile?.papel ?? "vendedor"} />
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
