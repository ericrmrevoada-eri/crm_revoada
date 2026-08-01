import type { TopProduto } from "@/actions/dashboard";
import { formatarMoeda } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankingBar } from "@/components/dashboard/ranking-bar";

export function TopProdutos({ produtos }: { produtos: TopProduto[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-sm uppercase tracking-wide">
          Top {produtos.length || 10} produtos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RankingBar
          itens={produtos.map((p) => ({
            chave: p.produtoId,
            rotulo: p.nome,
            secundario: p.marca ?? undefined,
            valor: p.quantidade,
            valorRotulo: `${p.quantidade} un · ${formatarMoeda(p.valorTotal)}`,
          }))}
        />
      </CardContent>
    </Card>
  );
}
