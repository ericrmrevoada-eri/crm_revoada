import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link
        href="/"
        className="mb-8 font-heading text-3xl font-bold uppercase tracking-wide text-gradient-neon"
      >
        Revoada
      </Link>
      <Card className="w-full max-w-sm border-border/60">
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase tracking-wide">
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
