"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { registrarDespesa } from "@/actions/despesas";
import {
  CATEGORIAS_DESPESA,
  ROTULO_CATEGORIA_DESPESA,
  despesaSchema,
  type DespesaInput,
} from "@/lib/validations/financeiro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export function DespesaForm({ caixaAbertoId }: { caixaAbertoId: string | null }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DespesaInput>({
    resolver: zodResolver(despesaSchema),
    defaultValues: { categoria: "outros", pagoDoCaixa: false },
  });

  async function onSubmit(values: DespesaInput) {
    setServerError(null);
    const result = await registrarDespesa(values, caixaAbertoId);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    toast.success("Despesa lançada");
    reset({ categoria: "outros", pagoDoCaixa: false });
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset({ categoria: "outros", pagoDoCaixa: false });
          setServerError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-gradient-neon text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Lançar despesa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lançar despesa</DialogTitle>
          <DialogDescription>
            Despesas operacionais da loja. Se o pagamento saiu da gaveta, marque a opção para
            debitar do caixa aberto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Controller
                control={control}
                name="categoria"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_DESPESA.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {ROTULO_CATEGORIA_DESPESA[categoria]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoria && (
                <p className="text-sm text-destructive">{errors.categoria.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input id="valor" inputMode="decimal" {...register("valor")} />
              {errors.valor && <p className="text-sm text-destructive">{errors.valor.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" placeholder="Opcional" {...register("descricao")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" {...register("data")} />
          </div>

          <Controller
            control={control}
            name="pagoDoCaixa"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="pagoDoCaixa">Pago com dinheiro do caixa</Label>
                  <p className="text-xs text-muted-foreground">
                    {caixaAbertoId
                      ? "Entra como saída no fechamento do seu caixa aberto."
                      : "Indisponível: você não tem caixa aberto."}
                  </p>
                </div>
                <Switch
                  id="pagoDoCaixa"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!caixaAbertoId}
                />
              </div>
            )}
          />

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-neon text-white hover:opacity-90"
            >
              {isSubmitting ? "Salvando..." : "Lançar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
