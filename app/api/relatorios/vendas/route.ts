import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  listarDesempenhoVendedores,
  listarTopProdutos,
  listarVendasParaExportacao,
  obterResumoPeriodo,
} from "@/actions/dashboard";
import { assertIsAdmin } from "@/lib/auth/assert-admin";
import type { Periodo } from "@/lib/dashboard/periodo";
import { ROTULO_FORMA_PAGAMENTO } from "@/lib/validations/financeiro";

// Reconfirma admin aqui dentro: o proxy.ts não marca /api/* como rota de admin
// (só as páginas em ADMIN_ROUTES), então essa checagem é a única barreira real
// para quem tentar chamar o endpoint direto.
async function exigirAdmin() {
  try {
    await assertIsAdmin();
    return null;
  } catch {
    return NextResponse.json({ error: "Apenas administradores podem exportar relatórios" }, {
      status: 403,
    });
  }
}

function periodoDaQuery(request: NextRequest): Periodo {
  const params = request.nextUrl.searchParams;
  const hoje = new Date().toISOString().slice(0, 10);
  const inicio = params.get("inicio") || hoje;
  const fim = params.get("fim") || hoje;
  return inicio <= fim ? { inicio, fim } : { inicio: fim, fim: inicio };
}

function formatarMoedaCsv(valor: number) {
  return valor.toFixed(2).replace(".", ",");
}

function formatarDataHoraArquivo(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function celulaCsv(valor: string) {
  // Escapa só quando necessário (contém separador, aspas ou quebra de linha).
  return /[;"\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

async function gerarCsv(periodo: Periodo): Promise<string> {
  const vendas = await listarVendasParaExportacao(periodo);

  const linhas = [
    ["Data", "Vendedor", "Status", "Forma de pagamento", "Peças", "Desconto (R$)", "Total (R$)"],
    ...vendas.map((v) => [
      formatarDataHoraArquivo(v.criadoEm),
      v.vendedorNome,
      v.status === "concluida" ? "Concluída" : "Cancelada",
      ROTULO_FORMA_PAGAMENTO[v.formaPagamento as keyof typeof ROTULO_FORMA_PAGAMENTO] ??
        v.formaPagamento,
      String(v.pecas),
      formatarMoedaCsv(v.desconto),
      formatarMoedaCsv(v.valorTotal),
    ]),
  ];

  // BOM UTF-8 para o Excel reconhecer acentuação; ";" como separador (padrão
  // do Excel em pt-BR, que usa "," como separador decimal).
  return "﻿" + linhas.map((linha) => linha.map(celulaCsv).join(";")).join("\r\n");
}

async function gerarPdf(periodo: Periodo): Promise<Uint8Array> {
  const [resumo, produtos, vendedores, vendas] = await Promise.all([
    obterResumoPeriodo(periodo),
    listarTopProdutos(periodo),
    listarDesempenhoVendedores(periodo),
    listarVendasParaExportacao(periodo),
  ]);

  const doc = await PDFDocument.create();
  const fonte = await doc.embedFont(StandardFonts.Helvetica);
  const fonteNegrito = await doc.embedFont(StandardFonts.HelveticaBold);

  const larguraPagina = 595.28; // A4 retrato, em pontos
  const alturaPagina = 841.89;
  const margem = 48;
  const corTexto = rgb(0.1, 0.1, 0.1);
  const corMuted = rgb(0.45, 0.45, 0.45);

  let pagina = doc.addPage([larguraPagina, alturaPagina]);
  let y = alturaPagina - margem;

  function novaPagina() {
    pagina = doc.addPage([larguraPagina, alturaPagina]);
    y = alturaPagina - margem;
  }

  function garantirEspaco(altura: number) {
    if (y - altura < margem) novaPagina();
  }

  function texto(
    conteudo: string,
    opcoes: { tamanho?: number; negrito?: boolean; cor?: ReturnType<typeof rgb>; x?: number } = {},
  ) {
    const tamanho = opcoes.tamanho ?? 10;
    garantirEspaco(tamanho + 6);
    pagina.drawText(conteudo, {
      x: opcoes.x ?? margem,
      y,
      size: tamanho,
      font: opcoes.negrito ? fonteNegrito : fonte,
      color: opcoes.cor ?? corTexto,
    });
    y -= tamanho + 6;
  }

  function espacador(altura = 10) {
    y -= altura;
  }

  function linhaSeparadora() {
    garantirEspaco(12);
    pagina.drawLine({
      start: { x: margem, y },
      end: { x: larguraPagina - margem, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 12;
  }

  function linhaTabela(colunas: { texto: string; x: number; negrito?: boolean }[], tamanho = 9) {
    garantirEspaco(tamanho + 6);
    for (const coluna of colunas) {
      pagina.drawText(coluna.texto, {
        x: coluna.x,
        y,
        size: tamanho,
        font: coluna.negrito ? fonteNegrito : fonte,
        color: corTexto,
      });
    }
    y -= tamanho + 6;
  }

  texto("Loja Revoada — Relatório de vendas", { tamanho: 16, negrito: true });
  texto(`Período: ${periodo.inicio.split("-").reverse().join("/")} a ${periodo.fim.split("-").reverse().join("/")}`, {
    tamanho: 10,
    cor: corMuted,
  });
  espacador(8);

  texto("Resumo do período", { tamanho: 12, negrito: true });
  texto(`Faturamento: R$ ${formatarMoedaCsv(resumo.faturamento)}`);
  texto(`Vendas concluídas: ${resumo.vendas}`);
  texto(`Peças vendidas: ${resumo.pecas}`);
  texto(`Ticket médio: R$ ${formatarMoedaCsv(resumo.ticketMedio)}`);
  espacador(10);

  texto("Top produtos", { tamanho: 12, negrito: true });
  if (produtos.length === 0) {
    texto("Nenhuma venda no período.", { cor: corMuted });
  }
  for (const [indice, produto] of produtos.entries()) {
    texto(
      `${indice + 1}. ${produto.nome}${produto.marca ? ` (${produto.marca})` : ""} — ${produto.quantidade} un — R$ ${formatarMoedaCsv(produto.valorTotal)}`,
    );
  }
  espacador(10);

  texto("Desempenho por vendedor", { tamanho: 12, negrito: true });
  if (vendedores.length === 0) {
    texto("Nenhuma venda no período.", { cor: corMuted });
  }
  for (const vendedor of vendedores) {
    texto(
      `${vendedor.nome} — ${vendedor.vendas} vendas — ${vendedor.pecas} peças — R$ ${formatarMoedaCsv(vendedor.faturamento)} (ticket médio R$ ${formatarMoedaCsv(vendedor.ticketMedio)})`,
    );
  }
  espacador(10);
  linhaSeparadora();

  texto("Vendas detalhadas", { tamanho: 12, negrito: true });
  const colunasX = { data: margem, vendedor: margem + 95, status: margem + 220, forma: margem + 290, pecas: margem + 380, total: margem + 420 };
  linhaTabela(
    [
      { texto: "Data", x: colunasX.data, negrito: true },
      { texto: "Vendedor", x: colunasX.vendedor, negrito: true },
      { texto: "Status", x: colunasX.status, negrito: true },
      { texto: "Pagamento", x: colunasX.forma, negrito: true },
      { texto: "Peças", x: colunasX.pecas, negrito: true },
      { texto: "Total (R$)", x: colunasX.total, negrito: true },
    ],
    9,
  );

  if (vendas.length === 0) {
    texto("Nenhuma venda no período.", { cor: corMuted });
  }

  for (const venda of vendas) {
    linhaTabela([
      { texto: formatarDataHoraArquivo(venda.criadoEm).slice(0, 16), x: colunasX.data },
      { texto: venda.vendedorNome.slice(0, 18), x: colunasX.vendedor },
      { texto: venda.status === "concluida" ? "Concluída" : "Cancelada", x: colunasX.status },
      {
        texto:
          ROTULO_FORMA_PAGAMENTO[venda.formaPagamento as keyof typeof ROTULO_FORMA_PAGAMENTO] ??
          venda.formaPagamento,
        x: colunasX.forma,
      },
      { texto: String(venda.pecas), x: colunasX.pecas },
      { texto: formatarMoedaCsv(venda.valorTotal), x: colunasX.total },
    ]);
  }

  return doc.save();
}

export async function GET(request: NextRequest) {
  const negado = await exigirAdmin();
  if (negado) return negado;

  const periodo = periodoDaQuery(request);
  const formato = request.nextUrl.searchParams.get("formato") === "pdf" ? "pdf" : "csv";
  const nomeArquivo = `vendas-${periodo.inicio}-a-${periodo.fim}.${formato}`;

  if (formato === "pdf") {
    const bytes = await gerarPdf(periodo);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  }

  const csv = await gerarCsv(periodo);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
