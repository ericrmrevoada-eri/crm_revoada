export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarData(isoOuData: string) {
  // Campos `date` do Postgres chegam como "2026-08-01"; o construtor do Date
  // trataria isso como UTC e voltaria um dia no fuso do Brasil.
  const [ano, mes, dia] = isoOuData.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}
