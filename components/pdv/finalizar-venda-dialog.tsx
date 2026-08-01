"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Plus, Send, Trash2 } from "lucide-react";
import { registrarVenda } from "@/actions/vendas";
import {
  FORMAS_PAGAMENTO,
  ROTULO_FORMA_PAGAMENTO,
  type FormaPagamento,
} from "@/lib/validations/financeiro";
import { calcularSubtotal, useCarrinho, type ItemCarrinho } from "@/lib/pdv/carrinho-store";
import { formatarMoeda } from "@/lib/formatters";
import { paraNumeroDecimal } from "@/lib/validations/comum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LinhaPagamento = { forma: FormaPagamento; valor: string };

function montarResumoWhatsapp(itens: ItemCarrinho[], desconto: number, total: number) {
  const linhas = [
    "*Loja Revoada* — resumo da sua compra",
    "",
    ...itens.map(
      (i) =>
        `• ${i.quantidade}x ${i.produtoNome} (${i.tamanho}/${i.cor}) — ${formatarMoeda(
          i.quantidade * i.precoUnitario,
        )}`,
    ),
    "",
    `Subtotal: ${formatarMoeda(calcularSubtotal(itens))}`,
  ];

  if (desconto > 0) linhas.push(`Desconto: −${formatarMoeda(desconto)}`);
  linhas.push(`*Total: ${formatarMoeda(total)}*`);
  linhas.push("", "Obrigado pela preferência! 🧢");

  return linhas.join("\n");
}

// Montado pelo carrinho apenas quando o pagamento abre, e desmontado ao fechar:
// o estado inicial das formas de pagamento sai direto do total da venda.
export function FinalizarVendaDialog({
  onOpenChange,
  total,
}: {
  onOpenChange: (open: boolean) => void;
  total: number;
}) {
  const router = useRouter();
  const itens = useCarrinho((s) => s.itens);
  const desconto = useCarrinho((s) => s.desconto);
  const limpar = useCarrinho((s) => s.limpar);

  // Abre já com o total inteiro em dinheiro: o caso mais comum no balcão é uma
  // forma só, e assim o vendedor confirma em um toque.
  const [linhas, setLinhas] = useState<LinhaPagamento[]>([
    { forma: "dinheiro", valor: total.toFixed(2) },
  ]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [concluida, setConcluida] = useState<{
    itens: ItemCarrinho[];
    desconto: number;
    total: number;
  } | null>(null);
  const [telefone, setTelefone] = useState("");

  const somaPagamentos = useMemo(
    () =>
      Math.round(
        linhas.reduce((acc, l) => acc + (l.valor ? paraNumeroDecimal(l.valor) : 0), 0) * 100,
      ) / 100,
    [linhas],
  );
  const restante = Math.round((total - somaPagamentos) * 100) / 100;
  const podeConfirmar = Math.abs(restante) < 0.01 && itens.length > 0 && !enviando;

  function selecionarFormaUnica(forma: FormaPagamento) {
    setLinhas([{ forma, valor: total.toFixed(2) }]);
  }

  function adicionarLinha() {
    const formaLivre =
      FORMAS_PAGAMENTO.find((f) => !linhas.some((l) => l.forma === f)) ?? "dinheiro";
    setLinhas((atual) => [
      ...atual,
      { forma: formaLivre, valor: restante > 0 ? restante.toFixed(2) : "" },
    ]);
  }

  async function confirmar() {
    setErro(null);
    setEnviando(true);

    const result = await registrarVenda({
      itens: itens.map((i) => ({
        variacaoId: i.variacaoId,
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario,
      })),
      pagamentos: linhas
        .filter((l) => l.valor && paraNumeroDecimal(l.valor) > 0)
        .map((l) => ({ forma: l.forma, valor: paraNumeroDecimal(l.valor) })),
      desconto,
    });

    setEnviando(false);

    if (result.error) {
      setErro(result.error);
      return;
    }

    // Guarda uma cópia antes de limpar: o resumo do WhatsApp é montado sobre ela.
    setConcluida({ itens, desconto, total });
    limpar();
    toast.success("Venda registrada");
    router.refresh();
  }

  function abrirWhatsapp() {
    if (!concluida) return;
    const texto = montarResumoWhatsapp(concluida.itens, concluida.desconto, concluida.total);
    const numero = telefone.replace(/\D/g, "");
    const destino = numero ? `https://wa.me/55${numero}` : "https://wa.me/";
    window.open(`${destino}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
  }

  function fechar() {
    onOpenChange(false);
    setConcluida(null);
    setTelefone("");
  }

  return (
    <Dialog open onOpenChange={(next) => (next ? onOpenChange(true) : fechar())}>
      <DialogContent>
        {concluida ? (
          <>
            <DialogHeader>
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-neon">
                <Check className="h-5 w-5 text-white" />
              </div>
              <DialogTitle>Venda concluída</DialogTitle>
              <DialogDescription>
                {formatarMoeda(concluida.total)} · estoque já baixado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="telefone">WhatsApp do cliente (opcional)</Label>
              <Input
                id="telefone"
                inputMode="tel"
                placeholder="82 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                O texto abre pré-preenchido no WhatsApp; o envio é manual. Sem número, abre a
                lista de contatos.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={fechar}>
                Nova venda
              </Button>
              <Button onClick={abrirWhatsapp} className="bg-gradient-neon text-white hover:opacity-90">
                <Send className="h-4 w-4" />
                Enviar resumo
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Pagamento</DialogTitle>
              <DialogDescription>
                Total de {formatarMoeda(total)}. Use uma forma só ou divida entre várias.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2">
              {FORMAS_PAGAMENTO.map((forma) => {
                const ativa = linhas.length === 1 && linhas[0].forma === forma;
                return (
                  <Button
                    key={forma}
                    type="button"
                    variant={ativa ? "default" : "outline"}
                    className={`h-12 ${ativa ? "bg-gradient-neon text-white hover:opacity-90" : ""}`}
                    onClick={() => selecionarFormaUnica(forma)}
                  >
                    {ROTULO_FORMA_PAGAMENTO[forma]}
                  </Button>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-2">
              {linhas.map((linha, indice) => (
                <div key={indice} className="flex items-center gap-2">
                  <Select
                    value={linha.forma}
                    onValueChange={(valor) =>
                      setLinhas((atual) =>
                        atual.map((l, i) =>
                          i === indice ? { ...l, forma: valor as FormaPagamento } : l,
                        ),
                      )
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((forma) => (
                        <SelectItem key={forma} value={forma}>
                          {ROTULO_FORMA_PAGAMENTO[forma]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    inputMode="decimal"
                    className="w-28 tabular-nums"
                    value={linha.valor}
                    onChange={(e) =>
                      setLinhas((atual) =>
                        atual.map((l, i) => (i === indice ? { ...l, valor: e.target.value } : l)),
                      )
                    }
                  />
                  {linhas.length > 1 && (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setLinhas((atual) => atual.filter((_, i) => i !== indice))}
                      title="Remover forma"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {linhas.length < FORMAS_PAGAMENTO.length && (
                <Button type="button" variant="ghost" size="sm" onClick={adicionarLinha}>
                  <Plus className="h-4 w-4" />
                  Dividir em outra forma
                </Button>
              )}
            </div>

            <div
              className={`flex items-center justify-between rounded-lg p-3 text-sm font-semibold ${
                Math.abs(restante) < 0.01
                  ? "bg-muted"
                  : "border border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              <span>{restante > 0 ? "Falta lançar" : restante < 0 ? "Passou do total" : "Tudo lançado"}</span>
              <span className="tabular-nums">{formatarMoeda(Math.abs(restante))}</span>
            </div>

            {erro && <p className="text-sm text-destructive">{erro}</p>}

            <DialogFooter>
              <Button
                onClick={confirmar}
                disabled={!podeConfirmar}
                className="h-12 w-full bg-gradient-neon text-base text-white hover:opacity-90"
              >
                {enviando ? "Registrando..." : `Confirmar ${formatarMoeda(total)}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
