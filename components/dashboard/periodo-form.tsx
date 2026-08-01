"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Periodo } from "@/lib/dashboard/periodo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Filtra o ranking de produtos, o comparativo de vendedores e a exportação.
// Os cards "Hoje"/"Mês corrente" ficam fixos por design (métricas em tempo
// real, sempre relativas a agora) e não usam esse período.
export function PeriodoForm({ periodo }: { periodo: Periodo }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inicio, setInicio] = useState(periodo.inicio);
  const [fim, setFim] = useState(periodo.fim);

  function aplicar() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("inicio", inicio);
    params.set("fim", fim);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1.5">
        <Label htmlFor="inicio" className="text-xs">
          De
        </Label>
        <Input
          id="inicio"
          type="date"
          value={inicio}
          max={fim}
          onChange={(e) => setInicio(e.target.value)}
          className="h-9"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fim" className="text-xs">
          Até
        </Label>
        <Input
          id="fim"
          type="date"
          value={fim}
          min={inicio}
          onChange={(e) => setFim(e.target.value)}
          className="h-9"
        />
      </div>
      <Button size="sm" variant="outline" onClick={aplicar}>
        Aplicar
      </Button>
    </div>
  );
}
