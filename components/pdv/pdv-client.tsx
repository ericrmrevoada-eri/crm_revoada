"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImageOff, Search, ShoppingCart } from "lucide-react";
import type { ItemCatalogo } from "@/actions/vendas";
import { useCarrinho } from "@/lib/pdv/carrinho-store";
import { formatarMoeda } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CarrinhoPanel } from "@/components/pdv/carrinho-panel";

// Teto de itens renderizados por busca: o balcão precisa de resposta imediata, e
// uma grade de centenas de cards trava o toque em celular.
const LIMITE_RESULTADOS = 48;

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function PdvClient({ catalogo }: { catalogo: ItemCatalogo[] }) {
  const [busca, setBusca] = useState("");
  const adicionar = useCarrinho((s) => s.adicionar);
  const itensCarrinho = useCarrinho((s) => s.itens);

  const resultados = useMemo(() => {
    const termo = normalizar(busca.trim());
    const base = termo
      ? catalogo.filter((item) =>
          normalizar(
            `${item.produto_nome} ${item.marca ?? ""} ${item.categoria_nome ?? ""} ${item.tamanho} ${item.cor}`,
          ).includes(termo),
        )
      : catalogo;
    return base.slice(0, LIMITE_RESULTADOS);
  }, [busca, catalogo]);

  const totalPecas = itensCarrinho.reduce((acc, i) => acc + i.quantidade, 0);

  function aoTocar(item: ItemCatalogo) {
    if (item.quantidade_estoque <= 0) {
      toast.error("Sem estoque desta variação");
      return;
    }
    const { erro } = adicionar({
      variacaoId: item.variacao_id,
      produtoNome: item.produto_nome,
      marca: item.marca,
      tamanho: item.tamanho,
      cor: item.cor,
      precoUnitario: item.preco_venda,
      estoqueDisponivel: item.quantidade_estoque,
    });
    if (erro) toast.error(erro);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por produto, marca, categoria, tamanho ou cor"
            className="h-12 pl-9"
            autoFocus
          />
        </div>

        {catalogo.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum produto ativo com variação cadastrada. Cadastre no Estoque antes de vender.
          </p>
        ) : resultados.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nada encontrado para “{busca}”.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {resultados.map((item) => {
              const semEstoque = item.quantidade_estoque <= 0;
              return (
                <button
                  key={item.variacao_id}
                  type="button"
                  onClick={() => aoTocar(item)}
                  disabled={semEstoque}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2 text-left transition-colors hover:border-primary/60 disabled:opacity-50 disabled:hover:border-border"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                    {item.foto_url ? (
                      <Image
                        src={item.foto_url}
                        alt={item.produto_nome}
                        fill
                        sizes="(max-width: 640px) 45vw, 180px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageOff className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium leading-tight">
                      {item.produto_nome}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.tamanho}/{item.cor}
                      {item.marca && ` · ${item.marca}`}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatarMoeda(item.preco_venda)}
                      </span>
                      <Badge variant={semEstoque ? "destructive" : "outline"}>
                        {semEstoque ? "zerado" : `${item.quantidade_estoque} un`}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!busca && catalogo.length > LIMITE_RESULTADOS && (
          <p className="text-center text-xs text-muted-foreground">
            Mostrando {LIMITE_RESULTADOS} de {catalogo.length} variações — use a busca para
            encontrar o resto.
          </p>
        )}
      </div>

      {/* Desktop: carrinho fixo na lateral. Mobile: barra inferior que abre o mesmo painel. */}
      <aside className="hidden rounded-lg border border-border bg-card p-3 lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-6rem)]">
        <CarrinhoPanel />
      </aside>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="h-12 w-full bg-gradient-neon text-base text-white hover:opacity-90">
              <ShoppingCart className="h-4 w-4" />
              Carrinho{totalPecas > 0 ? ` (${totalPecas})` : ""}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader className="sr-only">
              <SheetTitle>Carrinho</SheetTitle>
            </SheetHeader>
            <div className="h-full px-4 pb-4">
              <CarrinhoPanel />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
