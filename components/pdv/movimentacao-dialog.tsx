"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";
import { registrarMovimentacao } from "@/actions/caixa";
import {
  movimentacaoCaixaSchema,
  type MovimentacaoCaixaInput,
} from "@/lib/validations/financeiro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";

export function MovimentacaoDialog({ caixaId }: { caixaId: string }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovimentacaoCaixaInput>({
    resolver: zodResolver(movimentacaoCaixaSchema),
    defaultValues: { tipo: "sangria" },
  });

  async function onSubmit(values: MovimentacaoCaixaInput) {
    setServerError(null);
    const result = await registrarMovimentacao(caixaId, values);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    toast.success(values.tipo === "sangria" ? "Sangria registrada" : "Suprimento registrado");
    reset({ tipo: "sangria" });
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset({ tipo: "sangria" });
          setServerError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" variant="outline">
          <ArrowRightLeft className="h-4 w-4" />
          Movimentar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimentar caixa</DialogTitle>
          <DialogDescription>
            Sangria retira dinheiro da gaveta (ex: levar ao banco). Suprimento coloca dinheiro
            (ex: reforço de troco).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sangria">Sangria (saída)</SelectItem>
                    <SelectItem value="suprimento">Suprimento (entrada)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo && <p className="text-sm text-destructive">{errors.tipo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input id="valor" inputMode="decimal" {...register("valor")} />
            {errors.valor && <p className="text-sm text-destructive">{errors.valor.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" placeholder="Opcional" {...register("descricao")} />
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-neon text-white hover:opacity-90"
            >
              {isSubmitting ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
