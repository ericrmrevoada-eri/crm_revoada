import { z } from "zod";

export const categoriaSchema = z.object({
  nome: z.string().min(2, "Informe o nome da categoria"),
  descricao: z.string().optional(),
});
export type CategoriaInput = z.infer<typeof categoriaSchema>;

export const fornecedorSchema = z.object({
  nome: z.string().min(2, "Informe o nome do fornecedor"),
  telefone: z.string().optional(),
  observacoes: z.string().optional(),
});
export type FornecedorInput = z.infer<typeof fornecedorSchema>;

// Mantidos como string (sem .transform) de propósito: o formulário (React Hook
// Form) trabalha só com strings vindas do <input>; a conversão pra number
// acontece na Server Action, logo antes de gravar no banco. Evita o
// descompasso de tipos entre o schema de validação e o schema do formulário.
const numeroDecimalTexto = z
  .string()
  .min(1, "Informe um valor")
  .refine((v) => !Number.isNaN(Number(v.replace(",", "."))), "Valor inválido");

export function paraNumeroDecimal(valor: string) {
  return Number(valor.replace(",", "."));
}

const numeroInteiroTexto = z
  .string()
  .min(1, "Informe um valor")
  .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, "Valor inválido");

export function paraNumeroInteiro(valor: string) {
  return Number(valor);
}

export const produtoSchema = z.object({
  nome: z.string().min(2, "Informe o nome do produto"),
  descricao: z.string().optional(),
  categoriaId: z.string().optional(),
  fornecedorId: z.string().optional(),
  marca: z.string().optional(),
  precoCusto: numeroDecimalTexto,
  precoVenda: numeroDecimalTexto,
  ativo: z.boolean(),
});
export type ProdutoInput = z.infer<typeof produtoSchema>;

export const variacaoSchema = z.object({
  tamanho: z.string().min(1, "Informe o tamanho"),
  cor: z.string().min(1, "Informe a cor"),
  quantidadeEstoque: numeroInteiroTexto,
  estoqueMinimo: numeroInteiroTexto,
});
export type VariacaoInput = z.infer<typeof variacaoSchema>;

export const entradaEstoqueSchema = z.object({
  variacaoProdutoId: z.string().min(1, "Selecione a variação"),
  fornecedorId: z.string().optional(),
  quantidade: z
    .string()
    .min(1, "Informe a quantidade")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, "Quantidade inválida"),
  lote: z.string().optional(),
  dataEntrada: z.string().optional(),
});
export type EntradaEstoqueInput = z.infer<typeof entradaEstoqueSchema>;
