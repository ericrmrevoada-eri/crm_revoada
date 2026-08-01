import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar — Loja Revoada" };

export default function LoginPage() {
  return (
    <AuthShell title="Entrar" description="Acesse o sistema da Loja Revoada">
      <LoginForm />
    </AuthShell>
  );
}
