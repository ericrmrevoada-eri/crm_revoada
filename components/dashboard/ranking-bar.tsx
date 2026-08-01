// Ranking de magnitude (produto mais vendido, vendedor com mais faturamento):
// série única, então uma cor só — sem legenda, o título já diz o que é.
// Barra horizontal com extremidade arredondada (4px) e base quadrada, valor
// direto na ponta. Ver skill de dataviz (marks-and-anatomy) para o porquê.
export function RankingBar({
  itens,
}: {
  itens: { chave: string; rotulo: string; secundario?: string; valor: number; valorRotulo: string }[];
}) {
  const maximo = Math.max(1, ...itens.map((i) => i.valor));

  if (itens.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhuma venda no período selecionado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {itens.map((item) => (
        <div key={item.chave} title={`${item.rotulo}: ${item.valorRotulo}`}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-medium">{item.rotulo}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {item.valorRotulo}
              {item.secundario && <span className="ml-1.5">· {item.secundario}</span>}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-r-[4px] bg-primary"
              style={{ width: `${Math.max(2, (item.valor / maximo) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
