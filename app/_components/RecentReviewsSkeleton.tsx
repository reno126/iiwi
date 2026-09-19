import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentReviewsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3"
      aria-busy="true"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className="flex h-full flex-col justify-between bg-white p-4 sm:p-5"
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="size-16 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="my-3 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </Card>
      ))}
    </div>
  );
}
