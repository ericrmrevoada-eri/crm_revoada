"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import {
  calcularSubtotal,
  calcularTotal,
  useCarrinho,
} from "@/lib/pdv/carrinho-store";
import { formatarMoeda } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FinalizarVendaDialog } from "@/components/pdv/finalizar-venda-dialog";

export function CarrinhoPanel() {
  const itens = useCarrinho((s) => s.itens);
  const desconto = useCarrinho((s) => s.desconto);
  const descontoTexto = useCarrinho((s) => s.descontoTexto);
  const alterarQuantidade = useCarrinho((s) => s.alterarQuantidade);
  const remover = useCarrinho((s) => s.remover);
  const definirDesconto = useCarrinho((s) => s.definirDesconto);
  const limpar = useCarrinho((s) => s.limpar);

  const [pagamentoAberto, setPagamentoAberto] = useState(false);

  const subtotal = calcularSubtotal(itens);
  const total = calcularTotal(itens, desconto);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide">
          <ShoppingCart className="h-4 w-4" />
          Carrinho
          {itens.length > 0 && (
            <span className="text-muted-foreground">
              ({itens.reduce((acc, i) => acc + i.quantidade, 0)})
            </span>
          )}
        </h2>
        {itens.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={limpar}
          >
            Limpar
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {itens.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Toque num produto para começar a venda.
          </p>
        ) : (
          itens.map((item) => (
            <div key={item.variacaoId} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.produtoNome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.tamanho}/{item.cor} · {formatarMoeda(item.precoUnitario)}
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => remover(item.variacaoId)}
                  title="Remover item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => alterarQuantidade(item.variacaoId, item.quantidade - 1)}
                    title="Diminuir"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm tabular-nums">{item.quantidade}</span>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={item.quantidade >= item.estoqueDisponivel}
                    onClick={() => alterarQuantidade(item.variacaoId, item.quantidade + 1)}
                    title="Aumentar"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatarMoeda(item.quantidade * item.precoUnitario)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatarMoeda(subtotal)}</span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desconto" className="text-xs">
            Desconto (R$) — para kits e promoções
          </Label>
          <Input
            id="desconto"
            inputMode="decimal"
            placeholder="0,00"
            value={descontoTexto}
            onChange={(e) => definirDesconto(e.target.value)}
            disabled={itens.length === 0}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="font-heading text-sm font-bold uppercase tracking-wide">Total</span>
          <span className="font-heading text-xl font-bold tabular-nums">
            {formatarMoeda(total)}
          </span>
        </div>

        <Button
          className="h-12 w-full bg-gradient-neon text-base text-white hover:opacity-90"
          disabled={itens.length === 0}
          onClick={() => setPagamentoAberto(true)}
        >
          Finalizar venda
        </Button>
      </div>

      {/* Montado só ao abrir: o estado das formas de pagamento nasce já com o
          total da venda, sem efeito de sincronização. */}
      {pagamentoAberto && (
        <FinalizarVendaDialog onOpenChange={setPagamentoAberto} total={total} />
      )}
    </div>
  );
}
