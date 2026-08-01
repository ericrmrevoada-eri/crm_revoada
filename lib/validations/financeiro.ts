import { z } from "zod";
import { numeroDecimalTexto, valorPositivoTexto } from "./comum";

export const abrirCaixaSchema = z.object({
  // Aceita zero: caixa pode abrir sem troco na gaveta.
  valorAbertura: numeroDecimalTexto,
});
export type AbrirCaixaInput = z.infer<typeof abrirCaixaSchema>;

export const movimentacaoCaixaSchema = z.object({
  tipo: z.enum(["sangria", "suprimento"], { error: "Selecione o tipo" }),
  valor: valorPositivoTexto,
  descricao: z.string().optional(),
});
export type MovimentacaoCaixaInput = z.infer<typeof movimentacaoCaixaSchema>;

export const fecharCaixaSchema = z.object({
  valorInformado: numeroDecimalTexto,
});
export type FecharCaixaInput = z.infer<typeof fecharCaixaSchema>;

export const CATEGORIAS_DESPESA = ["aluguel", "frete", "luz", "outros"] as const;

export const despesaSchema = z.object({
  categoria: z.enum(CATEGORIAS_DESPESA, { error: "Selecione a categoria" }),
  valor: valorPositivoTexto,
  descricao: z.string().optional(),
  data: z.string().optional(),
  // true = saiu dinheiro da gaveta, então também vira movimentação do caixa aberto.
  pagoDoCaixa: z.boolean(),
});
export type DespesaInput = z.infer<typeof despesaSchema>;

export const FORMAS_PAGAMENTO = [
  "dinheiro",
  "pix",
  "cartao_debito",
  "cartao_credito",
] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const ROTULO_FORMA_PAGAMENTO: Record<FormaPagamento | "misto", string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Cartão de débito",
  cartao_credito: "Cartão de crédito",
  misto: "Misto",
};

export const ROTULO_CATEGORIA_DESPESA: Record<
  (typeof CATEGORIAS_DESPESA)[number],
  string
> = {
  aluguel: "Aluguel",
  frete: "Frete",
  luz: "Luz",
  outros: "Outros",
};

// A venda chega da Server Action já em números (o carrinho vive no cliente como
// estado, não como formulário), então aqui o schema valida números de verdade.
export const itemVendaSchema = z.object({
  variacaoId: z.uuid("Variação inválida"),
  quantidade: z.number().int().positive("Quantidade inválida"),
  precoUnitario: z.number().nonnegative("Preço inválido"),
});

export const pagamentoVendaSchema = z.object({
  forma: z.enum(FORMAS_PAGAMENTO),
  valor: z.number().positive("Valor do pagamento inválido"),
});

export const registrarVendaSchema = z.object({
  itens: z.array(itemVendaSchema).min(1, "Adicione pelo menos um item ao carrinho"),
  pagamentos: z.array(pagamentoVendaSchema).min(1, "Informe a forma de pagamento"),
  desconto: z.number().nonnegative("Desconto inválido"),
});
export type RegistrarVendaInput = z.infer<typeof registrarVendaSchema>;
