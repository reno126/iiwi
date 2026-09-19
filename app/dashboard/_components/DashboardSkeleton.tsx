import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Card className="p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-8 w-48 sm:w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-40" />
        </div>
      </Card>

      <Card className="p-5 sm:p-6 shadow-xs space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-60" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-3/4" />
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </div>
      </Card>
    </div>
  );
}
