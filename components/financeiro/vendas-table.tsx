"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { cancelarVenda, type VendaResumida } from "@/actions/vendas";
import { formatarDataHora, formatarMoeda } from "@/lib/formatters";
import { ROTULO_FORMA_PAGAMENTO } from "@/lib/validations/financeiro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function VendasTable({ vendas }: { vendas: VendaResumida[] }) {
  const [alvo, setAlvo] = useState<VendaResumida | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmarCancelamento() {
    if (!alvo) return;
    setErro(null);
    startTransition(async () => {
      const result = await cancelarVenda(alvo.id);
      if (result?.error) {
        setErro(result.error);
        return;
      }
      toast.success("Venda cancelada e estoque estornado");
      setAlvo(null);
    });
  }

  if (vendas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhuma venda registrada ainda.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Peças</TableHead>
              <TableHead className="text-right">Desconto</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendas.map((venda) => (
              <TableRow key={venda.id} className={venda.status === "cancelada" ? "opacity-60" : ""}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatarDataHora(venda.criado_em)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{venda.vendedor_nome ?? "—"}</span>
                    {venda.status === "cancelada" && <Badge variant="destructive">cancelada</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  {ROTULO_FORMA_PAGAMENTO[
                    venda.forma_pagamento as keyof typeof ROTULO_FORMA_PAGAMENTO
                  ] ?? venda.forma_pagamento}
                </TableCell>
                <TableCell className="text-right tabular-nums">{venda.total_pecas}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {venda.desconto > 0 ? `−${formatarMoeda(venda.desconto)}` : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatarMoeda(venda.valor_total)}
                </TableCell>
                <TableCell>
                  {venda.status === "concluida" && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title="Cancelar venda"
                      onClick={() => {
                        setErro(null);
                        setAlvo(venda);
                      }}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={alvo !== null}
        onOpenChange={(next) => {
          if (!next) {
            setAlvo(null);
            setErro(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar venda</DialogTitle>
            <DialogDescription>
              {alvo && (
                <>
                  Venda de {formatarMoeda(alvo.valor_total)} em{" "}
                  {formatarDataHora(alvo.criado_em)}. As peças voltam para o estoque e a entrada
                  sai do caixa. Só é possível enquanto o caixa da venda estiver aberto.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlvo(null)}>
              Voltar
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={confirmarCancelamento}>
              {isPending ? "Cancelando..." : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
