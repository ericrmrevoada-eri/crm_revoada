import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Package, ShoppingCart, Users, Wallet } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const adminNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendedores", label: "Vendedores", icon: Users },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/pdv", label: "PDV", icon: ShoppingCart },
];
