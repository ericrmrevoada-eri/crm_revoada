import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PlaceholderPage({
  title,
  description,
  fase,
}: {
  title: string;
  description: string;
  fase: string;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">
        {title}
      </h1>
      <Card className="mt-4 border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Construction className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground">Chega na {fase}.</p>
        </CardContent>
      </Card>
    </div>
  );
}
