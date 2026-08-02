import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="font-heading text-lg font-bold uppercase tracking-wide text-gradient-neon">
        Revoada
      </span>
      <h1 className="text-xl font-semibold text-foreground">
        Página não encontrada
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        O endereço que você tentou acessar não existe.
      </p>
      <Button asChild className="bg-gradient-neon text-white hover:opacity-90">
        <Link href="/">Voltar para o início</Link>
      </Button>
    </div>
  );
}
