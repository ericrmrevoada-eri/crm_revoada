"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { toast } from "sonner";
import { alternarAtivoProduto, type Produto } from "@/actions/produtos";
import type { Categoria } from "@/actions/categorias";
import type { Fornecedor } from "@/actions/fornecedores";
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
import { ProdutoForm } from "@/components/admin/produto-form";
import { VariacoesDialog } from "@/components/admin/variacoes-dialog";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProdutosTable({
  produtos,
  categorias,
  fornecedores,
}: {
  produtos: Produto[];
  categorias: Categoria[];
  fornecedores: Fornecedor[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleAtivo(produto: Produto) {
    setPendingId(produto.id);
    startTransition(async () => {
      const result = await alternarAtivoProduto(produto.id, !produto.ativo);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(produto.ativo ? "Produto desativado" : "Produto ativado");
      }
      setPendingId(null);
    });
  }

  if (produtos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhum produto cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14"></TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="text-right">Venda</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtos.map((produto) => (
            <TableRow key={produto.id}>
              <TableCell>
                {produto.foto_url ? (
                  <Image
                    src={produto.foto_url}
                    alt={produto.nome}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <ImageOff className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium">{produto.nome}</div>
                <div className="text-xs text-muted-foreground">{produto.marca || "—"}</div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {produto.categoria_nome || "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums-tight">
                {formatarMoeda(produto.preco_custo)}
              </TableCell>
              <TableCell className="text-right tabular-nums-tight">
                {formatarMoeda(produto.preco_venda)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{produto.total_variacoes} var.</span>
                  {produto.variacoes_abaixo_minimo > 0 && (
                    <Badge variant="destructive">{produto.variacoes_abaixo_minimo} baixo</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={produto.ativo ? "default" : "outline"}>
                  {produto.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <VariacoesDialog produto={produto} fornecedores={fornecedores} />
                  <ProdutoForm
                    produto={produto}
                    categorias={categorias}
                    fornecedores={fornecedores}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending && pendingId === produto.id}
                    onClick={() => toggleAtivo(produto)}
                  >
                    {produto.ativo ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
