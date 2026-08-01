"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Fica invisível na maior parte do tempo: um canal Realtime escutando vendas,
// caixas, movimentações e despesas. Como as métricas vêm de Server Components,
// não há como "atualizar o estado" no cliente — o jeito é pedir ao Next para
// buscar a página de novo (router.refresh()), que reexecuta as Server Actions
// com dado fresco sem perder o estado de UI já montado.
export function RealtimeWatcher() {
  const router = useRouter();
  const [aoVivo, setAoVivo] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel("dashboard-tempo-real")
      .on("postgres_changes", { event: "*", schema: "public", table: "vendas" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "caixas" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "movimentacoes_caixa" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "despesas" }, () => {
        router.refresh();
      })
      .subscribe((status) => setAoVivo(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(canal);
    };
  }, [router]);

  return (
    <span
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      title={aoVivo ? "Recebendo atualizações em tempo real" : "Conectando..."}
    >
      <Radio className={`h-3 w-3 ${aoVivo ? "text-primary" : "text-muted-foreground"}`} />
      {aoVivo ? "Ao vivo" : "Conectando..."}
    </span>
  );
}
