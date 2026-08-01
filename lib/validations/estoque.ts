import { z } from "zod";
import {
  numeroDecimalTexto,
  numeroInteiroTexto,
  paraNumeroDecimal,
  paraNumeroInteiro,
} from "./comum";

// Re-exportados porque as Server Actions de estoque já importam os conversores
// daqui; a definição mora em ./comum, compartilhada com o financeiro.
export { paraNumeroDecimal, paraNumeroInteiro };

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
