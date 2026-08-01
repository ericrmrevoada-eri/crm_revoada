"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { fecharCaixa, type ResumoCaixa } from "@/actions/caixa";
import { fecharCaixaSchema, type FecharCaixaInput } from "@/lib/validations/financeiro";
import { formatarMoeda } from "@/lib/formatters";
import type { ResumoFechado } from "@/components/pdv/fechamento-resumo-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function Linha({ rotulo, valor, negativo }: { rotulo: string; valor: number; negativo?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="tabular-nums">
        {negativo ? "− " : ""}
        {formatarMoeda(valor)}
      </span>
    </div>
  );
}

export function FecharCaixaDialog({
  caixaId,
  resumo,
  onFechado,
}: {
  caixaId: string;
  resumo: ResumoCaixa | null;
  onFechado: (resultado: ResumoFechado) => void;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FecharCaixaInput>({ resolver: zodResolver(fecharCaixaSchema) });

  async function onSubmit(values: FecharCaixaInput) {
    setServerError(null);
    const result = await fecharCaixa(caixaId, values);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    // A conferência é mostrada pelo componente pai, não por este diálogo: fechar
    // o caixa faz o servidor devolver caixa=null e esta árvore inteira desmonta
    // junto com a revalidação da página.
    setOpen(false);
    reset();
    if (result.resumo) onFechado(result.resumo);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
          setServerError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" variant="outline">
          <LockKeyhole className="h-4 w-4" />
          Fechar caixa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechar caixa</DialogTitle>
          <DialogDescription>
            Conte o dinheiro da gaveta e informe o total. O sistema compara com o valor
            calculado e destaca a diferença.
          </DialogDescription>
        </DialogHeader>

        {resumo && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Linha rotulo="Abertura" valor={resumo.valor_abertura} />
            <Linha rotulo="Vendas em dinheiro" valor={resumo.vendas_dinheiro} />
            <Linha rotulo="Suprimentos" valor={resumo.suprimentos} />
            <Linha rotulo="Sangrias" valor={resumo.sangrias} negativo />
            <Linha rotulo="Despesas pagas do caixa" valor={resumo.despesas} negativo />
            <Separator />
            <div className="flex items-center justify-between font-heading text-sm font-bold uppercase tracking-wide">
              <span>Esperado na gaveta</span>
              <span className="tabular-nums">{formatarMoeda(resumo.valor_calculado)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Vendas em Pix/cartão ({formatarMoeda(resumo.vendas_outras)}) não entram no
              dinheiro da gaveta.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="valorInformado">Valor contado na gaveta (R$)</Label>
            <Input
              id="valorInformado"
              inputMode="decimal"
              className="h-12 text-lg"
              {...register("valorInformado")}
            />
            {errors.valorInformado && (
              <p className="text-sm text-destructive">{errors.valorInformado.message}</p>
            )}
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-neon text-white hover:opacity-90"
            >
              {isSubmitting ? "Fechando..." : "Confirmar fechamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
