import type { Caixa } from "@/actions/caixa";
import { formatarDataHora, formatarMoeda } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function Divergencia({ caixa }: { caixa: Caixa }) {
  if (
    caixa.status === "aberto" ||
    caixa.valor_fechamento_informado === null ||
    caixa.valor_fechamento_calculado === null
  ) {
    return <span className="text-muted-foreground">—</span>;
  }

  const diferenca =
    Math.round((caixa.valor_fechamento_informado - caixa.valor_fechamento_calculado) * 100) / 100;

  if (Math.abs(diferenca) < 0.01) {
    return <Badge variant="secondary">confere</Badge>;
  }

  return (
    <Badge variant="destructive">
      {diferenca > 0 ? "sobra " : "falta "}
      {formatarMoeda(Math.abs(diferenca))}
    </Badge>
  );
}

export function CaixasTable({ caixas }: { caixas: Caixa[] }) {
  if (caixas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhum caixa aberto até agora.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operador</TableHead>
            <TableHead>Abertura</TableHead>
            <TableHead>Fechamento</TableHead>
            <TableHead className="text-right">Inicial</TableHead>
            <TableHead className="text-right">Calculado</TableHead>
            <TableHead className="text-right">Informado</TableHead>
            <TableHead>Conferência</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {caixas.map((caixa) => (
            <TableRow key={caixa.id}>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <span>{caixa.vendedor_nome ?? "—"}</span>
                  {caixa.status === "aberto" && <Badge>aberto</Badge>}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatarDataHora(caixa.data_abertura)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {caixa.data_fechamento ? formatarDataHora(caixa.data_fechamento) : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatarMoeda(caixa.valor_abertura)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {caixa.valor_fechamento_calculado === null
                  ? "—"
                  : formatarMoeda(caixa.valor_fechamento_calculado)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {caixa.valor_fechamento_informado === null
                  ? "—"
                  : formatarMoeda(caixa.valor_fechamento_informado)}
              </TableCell>
              <TableCell>
                <Divergencia caixa={caixa} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
