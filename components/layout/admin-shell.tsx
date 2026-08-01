"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserMenu } from "@/components/layout/user-menu";
import { adminNavItems } from "@/components/layout/admin-nav-items";

function NavLinks({
  onNavigate,
  estoqueBaixoCount,
}: {
  onNavigate?: () => void;
  estoqueBaixoCount: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {adminNavItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              active && "bg-sidebar-accent text-sidebar-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
            {item.href === "/estoque" && estoqueBaixoCount > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {estoqueBaixoCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  nome,
  papel,
  estoqueBaixoCount = 0,
  children,
}: {
  nome: string;
  papel: string;
  estoqueBaixoCount?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <span className="font-heading text-lg font-bold uppercase tracking-wide text-gradient-neon">
            Revoada
          </span>
        </div>
        <NavLinks estoqueBaixoCount={estoqueBaixoCount} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <SheetContent side="left" className="w-64 bg-sidebar p-0">
                <SheetHeader className="border-b border-sidebar-border">
                  <SheetTitle className="text-gradient-neon uppercase tracking-wide">
                    Revoada
                  </SheetTitle>
                </SheetHeader>
                <NavLinks
                  onNavigate={() => setOpen(false)}
                  estoqueBaixoCount={estoqueBaixoCount}
                />
              </SheetContent>
            </Sheet>
            <span className="font-heading text-base font-bold uppercase tracking-wide text-gradient-neon">
              Revoada
            </span>
          </div>
          <div className="hidden md:block" />
          <UserMenu nome={nome} papel={papel} />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
