import "server-only";

// As funções do banco sinalizam falha de regra de negócio com códigos secos
// (raise exception 'CAIXA_FECHADO'). Traduzir aqui, e não no SQL, mantém o banco
// agnóstico de idioma e a mensagem do usuário num lugar só.
const MENSAGENS: Record<string, string> = {
  NAO_AUTENTICADO: "Sessão expirada. Faça login novamente.",
  CONTA_INATIVA: "Sua conta está desativada. Fale com o administrador.",
  SEM_PERMISSAO: "Você não tem permissão para esta ação.",
  CAIXA_FECHADO: "Abra um caixa antes de registrar vendas.",
  CAIXA_JA_FECHADO: "Este caixa já foi fechado.",
  CAIXA_INEXISTENTE: "Caixa não encontrado.",
  CARRINHO_VAZIO: "Adicione pelo menos um item ao carrinho.",
  PAGAMENTO_AUSENTE: "Informe a forma de pagamento.",
  PAGAMENTO_DIVERGENTE: "A soma dos pagamentos não fecha com o total da venda.",
  DESCONTO_INVALIDO: "Desconto inválido.",
  DESCONTO_MAIOR_QUE_TOTAL: "O desconto não pode ser maior que o total da venda.",
  ITEM_INVALIDO: "Há um item inválido no carrinho.",
  VARIACAO_INEXISTENTE: "Um dos produtos do carrinho não existe mais.",
  VENDA_INEXISTENTE: "Venda não encontrada.",
  VENDA_JA_CANCELADA: "Esta venda já está cancelada.",
  VALOR_INVALIDO: "Valor inválido.",
};

export function traduzirErroBanco(erro: unknown, fallback: string): string {
  const mensagem =
    typeof erro === "object" && erro !== null && "message" in erro
      ? String((erro as { message: unknown }).message)
      : String(erro ?? "");

  // ESTOQUE_INSUFICIENTE carrega o rótulo da peça depois dos dois-pontos, para o
  // vendedor saber exatamente qual item tirar do carrinho.
  if (mensagem.includes("ESTOQUE_INSUFICIENTE")) {
    const peca = mensagem.split("ESTOQUE_INSUFICIENTE:")[1]?.trim();
    return peca
      ? `Estoque insuficiente para ${peca}.`
      : "Estoque insuficiente para um dos itens.";
  }

  for (const [codigo, texto] of Object.entries(MENSAGENS)) {
    if (mensagem.includes(codigo)) return texto;
  }

  return fallback;
}
