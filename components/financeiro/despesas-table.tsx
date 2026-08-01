import type { Despesa } from "@/actions/despesas";
import { formatarData, formatarMoeda } from "@/lib/formatters";
import { ROTULO_CATEGORIA_DESPESA } from "@/lib/validations/financeiro";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DespesasTable({ despesas }: { despesas: Despesa[] }) {
  if (despesas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhuma despesa lançada ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Lançado por</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {despesas.map((despesa) => (
            <TableRow key={despesa.id}>
              <TableCell className="whitespace-nowrap">{formatarData(despesa.data)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant="outline">{ROTULO_CATEGORIA_DESPESA[despesa.categoria]}</Badge>
                  {despesa.pago_do_caixa && <Badge variant="secondary">do caixa</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{despesa.descricao ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {despesa.criado_por_nome ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums text-destructive">
                −{formatarMoeda(despesa.valor)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
