"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { abrirCaixa } from "@/actions/caixa";
import { abrirCaixaSchema, type AbrirCaixaInput } from "@/lib/validations/financeiro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Porta de entrada do PDV: sem caixa aberto ninguém vende, então esta é a única
// tela que aparece até o operador informar o valor inicial da gaveta.
export function AbrirCaixaCard() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AbrirCaixaInput>({
    resolver: zodResolver(abrirCaixaSchema),
    defaultValues: { valorAbertura: "0" },
  });

  async function onSubmit(values: AbrirCaixaInput) {
    setServerError(null);
    const result = await abrirCaixa(values);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    toast.success("Caixa aberto. Bom trabalho!");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center">
      <Card>
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-neon">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="font-heading uppercase tracking-wide">Abrir caixa</CardTitle>
          <CardDescription>
            Informe quanto há de troco na gaveta agora. O fechamento vai comparar esse valor
            com o que o sistema calcular.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="valorAbertura">Valor de abertura (R$)</Label>
              <Input
                id="valorAbertura"
                inputMode="decimal"
                autoFocus
                className="h-12 text-lg"
                {...register("valorAbertura")}
              />
              {errors.valorAbertura && (
                <p className="text-sm text-destructive">{errors.valorAbertura.message}</p>
              )}
            </div>
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full bg-gradient-neon text-base text-white hover:opacity-90"
            >
              {isSubmitting ? "Abrindo..." : "Abrir caixa e começar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
