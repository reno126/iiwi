import { Skeleton } from "@/components/ui/skeleton";

export function ShopsSkeleton() {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
      aria-busy="true"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center p-4 rounded-xl border bg-white shadow-2xs gap-2.5 h-28 sm:h-32"
        >
          <div className="h-12 w-full flex items-center justify-center p-1">
            <Skeleton className="size-12 rounded-md" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
