import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Redefinir senha — Loja Revoada" };

export default function RedefinirSenhaPage() {
  return (
    <AuthShell title="Redefinir senha" description="Escolha sua nova senha de acesso">
      <ResetPasswordForm />
    </AuthShell>
  );
}
