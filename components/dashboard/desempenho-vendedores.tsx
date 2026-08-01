import type { DesempenhoVendedor } from "@/actions/dashboard";
import { formatarMoeda } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankingBar } from "@/components/dashboard/ranking-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DesempenhoVendedores({ vendedores }: { vendedores: DesempenhoVendedor[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-sm uppercase tracking-wide">
          Desempenho por vendedor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RankingBar
          itens={vendedores.map((v) => ({
            chave: v.vendedorId,
            rotulo: v.nome,
            valor: v.faturamento,
            valorRotulo: formatarMoeda(v.faturamento),
          }))}
        />

        {vendedores.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Peças</TableHead>
                  <TableHead className="text-right">Ticket médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendedores.map((v) => (
                  <TableRow key={v.vendedorId}>
                    <TableCell>{v.nome}</TableCell>
                    <TableCell className="text-right tabular-nums">{v.vendas}</TableCell>
                    <TableCell className="text-right tabular-nums">{v.pecas}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatarMoeda(v.ticketMedio)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
