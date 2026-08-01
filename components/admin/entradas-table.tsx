import type { EntradaEstoque } from "@/actions/entradas-estoque";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function EntradasTable({ entradas }: { entradas: EntradaEstoque[] }) {
  if (entradas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhuma entrada de estoque registrada ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Variação</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entradas.map((entrada) => (
            <TableRow key={entrada.id}>
              <TableCell>{formatarData(entrada.data_entrada)}</TableCell>
              <TableCell className="font-medium">{entrada.produto_nome}</TableCell>
              <TableCell className="text-muted-foreground">
                {entrada.variacao_tamanho}/{entrada.variacao_cor}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {entrada.fornecedor_nome || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{entrada.lote || "—"}</TableCell>
              <TableCell className="text-right tabular-nums-tight">
                +{entrada.quantidade}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
