import { FileSpreadsheet, FileText } from "lucide-react";
import type { Periodo } from "@/lib/dashboard/periodo";
import { Button } from "@/components/ui/button";

// Links diretos para o Route Handler de exportação — sem necessidade de client
// component, o período já é conhecido no servidor ao renderizar a página.
export function ExportarButtons({ periodo }: { periodo: Periodo }) {
  const query = `inicio=${periodo.inicio}&fim=${periodo.fim}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <a href={`/api/relatorios/vendas?formato=csv&${query}`} download>
          <FileSpreadsheet className="h-4 w-4" />
          Exportar CSV
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={`/api/relatorios/vendas?formato=pdf&${query}`} download>
          <FileText className="h-4 w-4" />
          Exportar PDF
        </a>
      </Button>
    </div>
  );
}
