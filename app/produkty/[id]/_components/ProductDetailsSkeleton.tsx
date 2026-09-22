import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { AuthorSignatureSkeleton } from "@/components/reviews/AuthorSignature";

export function ProductDetailsSkeleton() {
  return (
    <PageContainer
      data-testid="product-details-skeleton"
      size="lg"
      className="animate-pulse gap-8"
    >
      <div>
        <Skeleton className="h-8 w-44 rounded-md" />
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            <Skeleton className="mx-auto size-36 shrink-0 rounded-xl sm:mx-0 sm:size-44" />

            <div className="min-w-0 flex-1 space-y-4">
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

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Skeleton className="h-6 w-32 rounded-md" />
                <Skeleton className="h-9 w-36 rounded-md" />
              </div>

              <div className="flex flex-wrap gap-4 border-t border-border/50 pt-2">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-5 w-8 rounded-md" />
        </div>

        <div className="space-y-4">
          {[1, 2].map((itemIndex) => (
            <Card key={itemIndex} className="border shadow-2xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <AuthorSignatureSkeleton />
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
