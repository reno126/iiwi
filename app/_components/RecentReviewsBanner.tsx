import Link from "next/link";
import type { RecentReviewItem } from "@/serverActions/recentReviewsGet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { StarRating } from "@/components/reviews/StarRating";
import { formatPolishDate, formatReviewCount } from "@/lib/formatters";

interface RecentReviewsBannerProps {
  reviews: RecentReviewItem[];
}

export function RecentReviewsBanner({ reviews }: RecentReviewsBannerProps) {
  if (reviews.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center bg-white shadow-2xs">
        <p className="text-sm text-muted-foreground">
          Brak dodanych opinii. Bądź pierwszą osobą, która doda opinię!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {reviews.map((review) => {
        const rating = review.rate;
        const authorName = review.user?.name || "Anonimowy użytkownik";

        return (
          <Link
            href={`/produkty/${review.product.id}`}
            key={review.id}
            className="group block h-full"
          >
            <Card className="h-full flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md bg-white p-4 sm:p-5">
              <div>
                <div className="flex items-start gap-3">
                  <ProductThumbnail
                    src={review.product.imageUrl}
                    alt={review.product.name}
                    size="md"
                    priority={true}
                    className="size-16 rounded-lg border shrink-0"
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {review.product.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {review.product.shop?.name && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0.5"
                        >
                          {review.product.shop.name}
                        </Badge>
                      )}
                      {review.product.code && (
                        <span className="text-xs text-muted-foreground truncate">
                          {review.product.code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="my-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <StarRating rate={rating} size="sm" showValue />
                    {review.product.rate_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({formatReviewCount(review.product.rate_count)})
                      </span>
                    )}
                  </div>

                  {review.description ? (
                    <p className="text-sm text-muted-foreground italic line-clamp-3">
                      &ldquo;{review.description}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Opinia o produkcie
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border mt-auto">
                <span className="font-medium truncate max-w-40">
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
