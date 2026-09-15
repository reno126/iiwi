import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductsListSkeletonProps {
  count?: number;
}

export function ProductsListSkeleton({
  count = 6,
}: ProductsListSkeletonProps) {
  return (
    <div className="flex flex-col gap-4 w-full" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="py-1 md:py-5">
          <CardContent className="p-1 md:p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="size-20 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-5 w-3/4 max-w-sm" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
