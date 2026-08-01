import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "PDV — Loja Revoada" };

export default function PdvPage() {
  return (
    <PlaceholderPage
      title="PDV"
      description="Busca de produto, carrinho, pagamento (Pix/cartão/dinheiro) e baixa automática de estoque."
      fase="Fase 4 (Frente de caixa)"
    />
  );
}
