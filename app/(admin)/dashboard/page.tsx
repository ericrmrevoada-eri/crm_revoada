import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Dashboard — Loja Revoada" };

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      description="Faturamento do dia/mês, ticket médio, ranking de produtos e desempenho por vendedor."
      fase="Fase 5 (Dashboard e relatórios)"
    />
  );
}
