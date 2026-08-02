import { Skeleton } from "@/components/ui/skeleton";

export default function PdvLoading() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1 space-y-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
      <Skeleton className="hidden h-96 w-80 shrink-0 rounded-lg lg:block" />
    </div>
  );
}
