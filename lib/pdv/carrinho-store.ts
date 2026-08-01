import { create } from "zustand";

export type ItemCarrinho = {
  variacaoId: string;
  produtoNome: string;
  marca: string | null;
  tamanho: string;
  cor: string;
  precoUnitario: number;
  quantidade: number;
  estoqueDisponivel: number;
};

type CarrinhoState = {
  itens: ItemCarrinho[];
  desconto: number;
  // O texto digitado vive na store junto do número: assim limpar o carrinho já
  // limpa o campo, sem um efeito sincronizando estado local com a store.
  descontoTexto: string;
  adicionar: (item: Omit<ItemCarrinho, "quantidade">) => { erro?: string };
  alterarQuantidade: (variacaoId: string, quantidade: number) => void;
  remover: (variacaoId: string) => void;
  definirDesconto: (texto: string) => void;
  limpar: () => void;
};

// Único estado que precisa viver no cliente: o carrinho antes de finalizar a
// venda. Tudo o mais no PDV vem de Server Component.
export const useCarrinho = create<CarrinhoState>((set, get) => ({
  itens: [],
  desconto: 0,
  descontoTexto: "",

  adicionar: (item) => {
    const existente = get().itens.find((i) => i.variacaoId === item.variacaoId);
    const quantidadeAlvo = (existente?.quantidade ?? 0) + 1;

    if (quantidadeAlvo > item.estoqueDisponivel) {
      return { erro: `Só há ${item.estoqueDisponivel} em estoque` };
    }

    set((estado) => ({
      itens: existente
        ? estado.itens.map((i) =>
            i.variacaoId === item.variacaoId ? { ...i, quantidade: quantidadeAlvo } : i,
          )
        : [...estado.itens, { ...item, quantidade: 1 }],
    }));
    return {};
  },

  alterarQuantidade: (variacaoId, quantidade) =>
    set((estado) => ({
      itens: estado.itens.flatMap((i) => {
        if (i.variacaoId !== variacaoId) return [i];
        if (quantidade <= 0) return [];
        return [{ ...i, quantidade: Math.min(quantidade, i.estoqueDisponivel) }];
      }),
    })),

  remover: (variacaoId) =>
    set((estado) => ({ itens: estado.itens.filter((i) => i.variacaoId !== variacaoId) })),

  definirDesconto: (texto) => {
    const valor = texto ? Number(texto.replace(",", ".")) : 0;
    const limite = calcularSubtotal(get().itens);
    set({
      descontoTexto: texto,
      // Desconto nunca passa do subtotal: o total zera, não fica negativo.
      desconto: Number.isNaN(valor) ? 0 : Math.min(Math.max(0, valor), limite),
    });
  },

  limpar: () => set({ itens: [], desconto: 0, descontoTexto: "" }),
}));

export function calcularSubtotal(itens: ItemCarrinho[]) {
  return Math.round(itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0) * 100) / 100;
}

export function calcularTotal(itens: ItemCarrinho[], desconto: number) {
  return Math.max(0, Math.round((calcularSubtotal(itens) - desconto) * 100) / 100);
}
