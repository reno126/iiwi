import Link from "next/link";
import type { RecentReviewItem } from "@/serverActions/recentReviewsGet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { formatPolishDate } from "@/lib/formatters";

interface RecentReviewsBannerProps {
  reviews: RecentReviewItem[];
}

export function RecentReviewsBanner({ reviews }: RecentReviewsBannerProps) {
  if (reviews.length === 0) {
    return (
      <Empty className="border p-8 text-center">
        <EmptyDescription>
          Brak dodanych opinii. Bądź pierwszą osobą, która doda opinię!
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
      {reviews.map((review) => {
        const rating = review.rate;
        const authorName = review.user?.name || "Anonimowy użytkownik";

        return (
          <Link
            href={`/produkty/${review.product.id}`}
            key={review.id}
            className="group block h-full"
          >
            <Card className="flex h-full flex-col justify-between bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md sm:p-5">
              <div>
                <div className="flex items-start gap-3">
                  <ProductThumbnail
                    src={review.product.imageUrl}
                    alt={review.product.name}
                    size="md"
                    priority={true}
                    className="size-16 shrink-0 rounded-lg border"
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="line-clamp-2 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
                      {review.product.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {review.product.shop?.name && (
                        <Badge
                          variant="secondary"
                          className="px-2 py-0.5 text-xs"
                        >
                          {review.product.shop.name}
                        </Badge>
                      )}
                      {review.product.code && (
                        <span className="truncate text-xs text-muted-foreground">
                          {review.product.code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="my-3 space-y-2">
                  <RatingSummary
                    rate={rating}
                    count={review.product.rate_count}
                    size="sm"
                  />

                  {review.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground italic">
                      &ldquo;{review.description}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Opinia o produkcie
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="max-w-40 truncate font-medium">
                  {authorName}
                </span>
                <span>{formatPolishDate(review.createdAt)}</span>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
