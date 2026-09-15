import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProductDetailsSkeleton() {
  return (
    <div
      data-testid="product-details-skeleton"
      className="mx-auto max-w-4xl space-y-8 py-4 animate-pulse"
    >
      {/* Back Navigation Placeholder */}
      <div>
        <Skeleton className="h-8 w-44 rounded-md" />
      </div>

      {/* Main Product Overview Card Skeleton */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Product Image Skeleton */}
            <Skeleton className="size-36 sm:size-44 rounded-xl mx-auto sm:mx-0 shrink-0" />

            {/* Product Details Skeleton */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-8 w-3/4 max-w-md rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </div>

              {/* Rating & CTA */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Skeleton className="h-6 w-32 rounded-md" />
                <Skeleton className="h-9 w-36 rounded-md" />
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-border/50">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section Skeleton */}
      <section className="space-y-4">
        <div className="border-b border-border pb-3 flex items-center gap-2">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-5 w-8 rounded-md" />
        </div>

        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="border shadow-2xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
