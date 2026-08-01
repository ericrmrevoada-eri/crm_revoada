"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { alternarAtivoVendedor, type Vendedor } from "@/actions/vendedores";
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

export function VendedoresTable({ vendedores }: { vendedores: Vendedor[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleAtivo(vendedor: Vendedor) {
    setPendingId(vendedor.id);
    startTransition(async () => {
      const result = await alternarAtivoVendedor(vendedor.id, !vendedor.ativo);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(vendedor.ativo ? "Vendedor desativado" : "Vendedor ativado");
      }
      setPendingId(null);
    });
  }

  if (vendedores.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhum vendedor cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendedores.map((vendedor) => (
            <TableRow key={vendedor.id}>
              <TableCell className="font-medium">{vendedor.nome_completo}</TableCell>
              <TableCell className="text-muted-foreground">
                {vendedor.telefone || "—"}
              </TableCell>
              <TableCell>
                <Badge variant={vendedor.ativo ? "default" : "outline"}>
                  {vendedor.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending && pendingId === vendedor.id}
                  onClick={() => toggleAtivo(vendedor)}
                >
                  {vendedor.ativo ? "Desativar" : "Ativar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
