import { z } from "zod";

// Mantidos como string (sem .transform) de propósito: o formulário (React Hook
// Form) trabalha só com strings vindas do <input>; a conversão pra number
// acontece na Server Action, logo antes de gravar no banco. Evita o
// descompasso de tipos entre o schema de validação e o schema do formulário.
export const numeroDecimalTexto = z
  .string()
  .min(1, "Informe um valor")
  .refine((v) => !Number.isNaN(Number(v.replace(",", "."))), "Valor inválido");

export function paraNumeroDecimal(valor: string) {
  return Number(valor.replace(",", "."));
}

export const numeroInteiroTexto = z
  .string()
  .min(1, "Informe um valor")
  .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, "Valor inválido");

export function paraNumeroInteiro(valor: string) {
  return Number(valor);
}

// Valor de dinheiro que precisa ser positivo (sangria, suprimento, despesa) —
// diferente de numeroDecimalTexto, que aceita zero (ex: abertura de caixa vazio).
export const valorPositivoTexto = numeroDecimalTexto.refine(
  (v) => paraNumeroDecimal(v) > 0,
  "O valor deve ser maior que zero",
);
