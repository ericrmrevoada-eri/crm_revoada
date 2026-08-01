import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarVariacoesAbaixoMinimo } from "@/actions/variacoes";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({
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

  const estoqueBaixoCount = await contarVariacoesAbaixoMinimo();

  return (
    <AdminShell
      nome={profile?.nome_completo ?? "Admin"}
      papel={profile?.papel ?? "admin"}
      estoqueBaixoCount={estoqueBaixoCount}
    >
      {children}
    </AdminShell>
  );
}
