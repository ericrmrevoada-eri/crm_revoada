import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Financeiro — Loja Revoada" };

export default function FinanceiroPage() {
  return (
    <PlaceholderPage
      title="Financeiro"
      description="Abertura/fechamento de caixa, sangrias, suprimentos e despesas operacionais."
      fase="Fase 4 (PDV e Financeiro/Caixa)"
    />
  );
}
