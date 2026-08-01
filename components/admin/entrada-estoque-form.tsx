"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PackagePlus } from "lucide-react";
import { registrarEntrada } from "@/actions/entradas-estoque";
import type { Variacao } from "@/actions/variacoes";
import type { Fornecedor } from "@/actions/fornecedores";
import { entradaEstoqueSchema, type EntradaEstoqueInput } from "@/lib/validations/estoque";
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

const SEM_VALOR = "__none__";

export function EntradaEstoqueForm({
  variacao,
  produtoNome,
  fornecedores,
  onSuccess,
}: {
  variacao: Variacao;
  produtoNome: string;
  fornecedores: Fornecedor[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaEstoqueInput>({
    resolver: zodResolver(entradaEstoqueSchema),
    defaultValues: { variacaoProdutoId: variacao.id, fornecedorId: SEM_VALOR },
  });

  async function onSubmit(values: EntradaEstoqueInput) {
    setServerError(null);
    const payload = {
      ...values,
      variacaoProdutoId: variacao.id,
      fornecedorId: values.fornecedorId === SEM_VALOR ? undefined : values.fornecedorId,
    };
    const result = await registrarEntrada(payload);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    toast.success("Entrada registrada");
    reset({ variacaoProdutoId: variacao.id, fornecedorId: SEM_VALOR });
    setOpen(false);
    onSuccess();
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
        <Button size="icon-sm" variant="outline" title="Registrar entrada">
          <PackagePlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar entrada</DialogTitle>
          <DialogDescription>
            {produtoNome} — {variacao.tamanho}/{variacao.cor}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Controller
              control={control}
              name="fornecedorId"
              render={({ field }) => (
                <Select value={field.value ?? SEM_VALOR} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_VALOR}>Sem fornecedor</SelectItem>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input id="quantidade" inputMode="numeric" {...register("quantidade")} />
              {errors.quantidade && (
                <p className="text-sm text-destructive">{errors.quantidade.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lote">Lote</Label>
              <Input id="lote" {...register("lote")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataEntrada">Data</Label>
            <Input id="dataEntrada" type="date" {...register("dataEntrada")} />
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
