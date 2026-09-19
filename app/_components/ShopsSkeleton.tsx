import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ShopsSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4"
      aria-busy="true"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Card
          key={i}
          className="flex h-28 flex-col items-center justify-center gap-2.5 p-4 sm:h-32"
        >
          <div className="flex h-12 w-full items-center justify-center p-1">
            <Skeleton className="size-12 rounded-md" />
          </div>
          <Skeleton className="h-4 w-20" />
        </Card>
      ))}
    </div>
  );
}
