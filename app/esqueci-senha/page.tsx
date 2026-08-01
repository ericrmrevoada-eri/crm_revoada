import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Esqueci minha senha — Loja Revoada" };

export default function EsqueciSenhaPage() {
  return (
    <AuthShell
      title="Esqueci minha senha"
      description="Informe seu e-mail para receber o link de redefinição"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
