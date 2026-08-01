"use client";

import { useState } from "react";
import type { Caixa, MovimentacaoCaixa, ResumoCaixa } from "@/actions/caixa";
import type { ItemCatalogo, VendaResumida } from "@/actions/vendas";
import { AbrirCaixaCard } from "@/components/pdv/abrir-caixa-card";
import { CaixaBar } from "@/components/pdv/caixa-bar";
import { PdvClient } from "@/components/pdv/pdv-client";
import { MinhasVendas } from "@/components/pdv/minhas-vendas";
import {
  FechamentoResumoDialog,
  type ResumoFechado,
} from "@/components/pdv/fechamento-resumo-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Existe como Client Component só por causa do fechamento de caixa: a Server
// Action de fechar_caixa revalida a página, o servidor busca o caixa aberto de
// novo (agora null) e a árvore vinda do server troca de AbrirCaixaCard para
// CaixaBar. Sem esse wrapper, a conferência de sobra/falta desmontaria junto
// com a barra antes do operador conseguir ler o resultado.
export function PdvShell({
  caixa,
  resumo,
  movimentacoes,
  catalogo,
  vendas,
}: {
  caixa: Caixa | null;
  resumo: ResumoCaixa | null;
  movimentacoes: MovimentacaoCaixa[];
  catalogo: ItemCatalogo[];
  vendas: VendaResumida[];
}) {
  const [fechamento, setFechamento] = useState<ResumoFechado | null>(null);

  return (
    <>
      {caixa ? (
        <div className="space-y-4">
          <CaixaBar
            caixa={caixa}
            resumo={resumo}
            movimentacoes={movimentacoes}
            onFechado={setFechamento}
          />

          <Tabs defaultValue="vender">
            <TabsList>
              <TabsTrigger value="vender">Vender</TabsTrigger>
              <TabsTrigger value="minhas-vendas">Minhas vendas</TabsTrigger>
            </TabsList>
            <TabsContent value="vender">
              <PdvClient catalogo={catalogo} />
            </TabsContent>
            <TabsContent value="minhas-vendas">
              <MinhasVendas vendas={vendas} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <AbrirCaixaCard />
      )}

      <FechamentoResumoDialog resultado={fechamento} onClose={() => setFechamento(null)} />
    </>
  );
}
