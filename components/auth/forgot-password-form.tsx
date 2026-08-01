"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { esqueciSenha } from "@/actions/auth";
import { esqueciSenhaSchema, type EsqueciSenhaInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaInput>({ resolver: zodResolver(esqueciSenhaSchema) });

  async function onSubmit(values: EsqueciSenhaInput) {
    setServerError(null);
    const result = await esqueciSenha(values);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Se o e-mail informado existir na nossa base, você vai receber um link
          para redefinir sua senha em instantes. Confira também a caixa de spam.
        </p>
        <Link
          href="/login"
          className="text-sm text-foreground underline underline-offset-4"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@revoada.com"
          className="h-12 text-base"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-gradient-neon h-12 w-full text-base font-semibold text-white hover:opacity-90"
      >
        {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
      </Button>
      <Link
        href="/login"
        className="block text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Voltar para o login
      </Link>
    </form>
  );
}
