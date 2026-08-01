import type { Metadata } from "next";
import { listarVendedores } from "@/actions/vendedores";
import { VendedorForm } from "@/components/admin/vendedor-form";
import { VendedoresTable } from "@/components/admin/vendedores-table";

export const metadata: Metadata = { title: "Vendedores — Loja Revoada" };

export default async function VendedoresPage() {
  const vendedores = await listarVendedores();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">
            Vendedores
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre e gerencie o acesso dos vendedores ao sistema.
          </p>
        </div>
        <VendedorForm />
      </div>
      <VendedoresTable vendedores={vendedores} />
    </div>
  );
}
