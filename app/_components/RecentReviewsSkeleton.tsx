import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentReviewsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
      aria-busy="true"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className="h-full flex flex-col justify-between bg-white p-4 sm:p-5"
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="size-16 rounded-lg shrink-0" />
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
          <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </Card>
      ))}
    </div>
  );
}
