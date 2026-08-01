"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/auth/usuario-atual";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import { traduzirErroBanco } from "@/lib/supabase/erros";
import { registrarVendaSchema, type RegistrarVendaInput } from "@/lib/validations/financeiro";

export type ItemCatalogo = {
  variacao_id: string;
  produto_id: string;
  produto_nome: string;
  marca: string | null;
  categoria_nome: string | null;
  foto_url: string | null;
  tamanho: string;
  cor: string;
  preco_venda: number;
  quantidade_estoque: number;
};

export type VendaResumida = {
  id: string;
  criado_em: string;
  vendedor_id: string;
  vendedor_nome: string | null;
  status: "concluida" | "cancelada";
  forma_pagamento: string;
  valor_total: number;
  desconto: number;
  total_pecas: number;
};

// Catálogo do PDV: uma linha por variação, já com preço e estoque. Vendedor tem
// select em produtos/variações pela RLS, então a mesma função serve os dois papéis.
export async function listarCatalogoPdv(): Promise<ItemCatalogo[]> {
  await obterUsuarioAtual();
  const supabase = await createClient();

  const [{ data: variacoes }, { data: categorias }] = await Promise.all([
    supabase
      .from("variacoes_produto")
      .select(
        "id, tamanho, cor, quantidade_estoque, produtos!inner(id, nome, marca, foto_url, preco_venda, ativo, categoria_id)",
      )
      .eq("produtos.ativo", true)
      .order("nome", { referencedTable: "produtos" })
      .order("tamanho"),
    supabase.from("categorias").select("id, nome"),
  ]);

  const nomeCategoria = new Map((categorias ?? []).map((c) => [c.id, c.nome]));

  return (variacoes ?? []).map((v) => ({
    variacao_id: v.id,
    produto_id: v.produtos.id,
    produto_nome: v.produtos.nome,
    marca: v.produtos.marca,
    categoria_nome: v.produtos.categoria_id
      ? (nomeCategoria.get(v.produtos.categoria_id) ?? null)
      : null,
    foto_url: v.produtos.foto_url,
    tamanho: v.tamanho,
    cor: v.cor,
    preco_venda: v.produtos.preco_venda,
    quantidade_estoque: v.quantidade_estoque,
  }));
}

export async function registrarVenda(
  input: RegistrarVendaInput,
): Promise<{ error?: string; vendaId?: string; valorTotal?: number }> {
  const parsed = registrarVendaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await obterUsuarioAtual();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();

  // O preço praticado vem do banco, nunca do cliente: o único ajuste que o
  // vendedor controla é o desconto — e esse fica auditado pela própria função.
  const ids = [...new Set(parsed.data.itens.map((i) => i.variacaoId))];
  const { data: precos } = await supabase
    .from("variacoes_produto")
    .select("id, produtos!inner(preco_venda)")
    .in("id", ids);

  const precoPorVariacao = new Map(
    (precos ?? []).map((p) => [p.id, p.produtos.preco_venda]),
  );

  if (precoPorVariacao.size !== ids.length) {
    return { error: "Um dos produtos do carrinho não existe mais" };
  }

  const itens = parsed.data.itens.map((i) => ({
    variacao_id: i.variacaoId,
    quantidade: i.quantidade,
    preco_unitario: precoPorVariacao.get(i.variacaoId) ?? 0,
  }));

  const bruto = itens.reduce((acc, i) => acc + i.quantidade * i.preco_unitario, 0);
  const total = Math.round((bruto - parsed.data.desconto) * 100) / 100;

  if (total < 0) {
    return { error: "O desconto não pode ser maior que o total da venda" };
  }

  const pago = parsed.data.pagamentos.reduce((acc, p) => acc + p.valor, 0);
  if (Math.abs(pago - total) > 0.01) {
    return {
      error:
        "O total mudou (preço de produto atualizado). Refaça o carrinho para conferir os valores.",
    };
  }

  const { data, error } = await supabase.rpc("registrar_venda", {
    p_itens: itens,
    p_pagamentos: parsed.data.pagamentos.map((p) => ({ forma: p.forma, valor: p.valor })),
    p_desconto: parsed.data.desconto,
  });

  if (error) {
    return { error: traduzirErroBanco(error, "Não foi possível registrar a venda") };
  }

  revalidatePath("/pdv");
  revalidatePath("/estoque");
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
  return { vendaId: data as string, valorTotal: total };
}

async function montarVendasResumidas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  limite: number,
  apenasVendedorId?: string,
): Promise<VendaResumida[]> {
  let query = supabase
    .from("vendas")
    .select("id, criado_em, vendedor_id, status, forma_pagamento, valor_total, desconto")
    .order("criado_em", { ascending: false })
    .limit(limite);

  if (apenasVendedorId) query = query.eq("vendedor_id", apenasVendedorId);

  const { data: vendas } = await query;
  if (!vendas || vendas.length === 0) return [];

  const [{ data: itens }, { data: perfis }] = await Promise.all([
    supabase
      .from("itens_venda")
      .select("venda_id, quantidade")
      .in(
        "venda_id",
        vendas.map((v) => v.id),
      ),
    supabase.from("profiles").select("id, nome_completo"),
  ]);

  const nomes = new Map((perfis ?? []).map((p) => [p.id, p.nome_completo]));
  const pecas = new Map<string, number>();
  for (const item of itens ?? []) {
    pecas.set(item.venda_id, (pecas.get(item.venda_id) ?? 0) + item.quantidade);
  }

  return vendas.map((v) => ({
    ...v,
    vendedor_nome: nomes.get(v.vendedor_id) ?? null,
    total_pecas: pecas.get(v.id) ?? 0,
  }));
}

// Histórico do próprio operador, mostrado no PDV.
export async function listarMinhasVendas(limite = 20): Promise<VendaResumida[]> {
  const usuario = await obterUsuarioAtual();
  const supabase = await createClient();
  return montarVendasResumidas(supabase, limite, usuario.id);
}

export async function listarVendas(limite = 50): Promise<VendaResumida[]> {
  await assertIsAdmin();
  const supabase = await createClient();
  return montarVendasResumidas(supabase, limite);
}

export async function cancelarVenda(vendaId: string): Promise<{ error?: string }> {
  try {
    await assertIsAdmin();
  } catch {
    return { error: "Apenas administradores podem cancelar vendas" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_venda", { p_venda_id: vendaId });

  if (error) {
    // Cancelar depois do fechamento invalidaria um caixa já conferido; a função
    // do banco recusa, e aqui explicamos o caminho alternativo.
    if (String(error.message).includes("CAIXA_JA_FECHADO")) {
      return {
        error:
          "O caixa desta venda já foi fechado. Ajuste por entrada de estoque e despesa, para manter o fechamento rastreável.",
      };
    }
    return { error: traduzirErroBanco(error, "Não foi possível cancelar a venda") };
  }

  revalidatePath("/financeiro");
  revalidatePath("/estoque");
  revalidatePath("/dashboard");
  return {};
}
