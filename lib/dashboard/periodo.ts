export type Periodo = { inicio: string; fim: string };

export function inicioDoPeriodo(periodo: Periodo) {
  return new Date(`${periodo.inicio}T00:00:00`).toISOString();
}

export function fimDoPeriodo(periodo: Periodo) {
  return new Date(`${periodo.fim}T23:59:59.999`).toISOString();
}

// Mês corrente até hoje, no formato yyyy-mm-dd que o <input type="date"> espera.
export function periodoPadrao(): Periodo {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  return {
    inicio: inicioMes.toISOString().slice(0, 10),
    fim: agora.toISOString().slice(0, 10),
  };
}
