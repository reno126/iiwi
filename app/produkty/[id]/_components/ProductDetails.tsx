"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Calendar,
  ExternalLink,
  ChevronLeft,
  Star,
  User,
  MessageSquare,
  PlusCircle,
  Tag,
  Clock,
} from "lucide-react";
import type { ProductWithReviews } from "@/serverActions/productGetById";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReadMore } from "@/components/ReadMore";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { formatPolishDate, formatReviewCount } from "@/lib/formatters";
import { cn } from "@/lib/shadcn/utils";

interface StarRatingProps {
  rate: number;
  size?: "sm" | "md";
}

export function StarRating({ rate, size = "sm" }: StarRatingProps) {
  const iconSize = size === "md" ? "size-5" : "size-4";
  return (
    <div className="flex items-center gap-1" aria-label={`Ocena: ${rate} na 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconSize,
            star <= Math.round(rate)
              ? "fill-amber-400 text-amber-500"
              : "text-muted-foreground/30",
          )}
        />
      ))}
      <span
        className={cn(
          "ml-1 font-semibold text-foreground",
          size === "md" ? "text-base" : "text-sm",
        )}
      >
        {rate.toFixed(1)} / 5
      </span>
    </div>
  );
}

export interface ProductDetailsProps {
  product: ProductWithReviews;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter();
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  const handleReviewSuccess = () => {
    setIsReviewFormOpen(false);
    router.refresh();
  };

  const handleCancelReview = () => {
    setIsReviewFormOpen(false);
  };

  const creatorDisplayName =
    product.creator.name ||
    product.creator.email.split("@")[0] ||
    "Użytkownik";

  const hasDistinctUpdateDate =
    product.updatedAt.getTime() - product.createdAt.getTime() > 60000;

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      {/* Back Navigation */}
      <div>
        <Link
          href="/produkty"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 gap-1.5 text-muted-foreground hover:text-foreground",
          )}
        >
          <ChevronLeft className="size-4" />
          Wróć do listy produktów
        </Link>
      </div>

      {/* Main Product Card: Displays all product fields */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Product Image */}
            <div className="size-36 sm:size-44 rounded-xl bg-muted border flex items-center justify-center shrink-0 overflow-hidden mx-auto sm:mx-0">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="size-full object-contain p-2"
                />
              ) : (
                <Package className="size-16 text-muted-foreground" />
              )}
            </div>

            {/* Product Metadata & Details */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {product.name}
                  </h1>
                  {product.code && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Tag className="size-3" />
                      {product.code}
                    </Badge>
                  )}
                </div>

                {/* Rating Overview */}
                <div className="flex flex-wrap items-center gap-3">
                  {product.rate_count > 0 ? (
                    <StarRating rate={product.rate_avg} size="md" />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Brak ocen
                    </span>
                  )}
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    {formatReviewCount(product.rate_count)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* All Product Fields Grid */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-muted-foreground">
                {/* Product URL */}
                {product.productUrl && (
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <dt className="font-medium text-foreground">
                      Strona produktu:
                    </dt>
                    <dd className="truncate">
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <span className="truncate">{product.productUrl}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </dd>
                  </div>
                )}

                {/* Product Code */}
                {product.code && (
                  <div className="flex items-center gap-1.5">
                    <dt className="font-medium text-foreground">Kod SKU / EAN:</dt>
                    <dd className="font-mono text-foreground">{product.code}</dd>
                  </div>
                )}

                {/* Creator */}
                <div className="flex items-center gap-1.5">
                  <dt className="font-medium text-foreground">Dodany przez:</dt>
                  <dd className="flex items-center gap-1 text-foreground">
                    <User className="size-3.5 text-muted-foreground" />
                    {creatorDisplayName}
                  </dd>
                </div>

                {/* Date of Creation */}
                <div className="flex items-center gap-1.5">
                  <dt className="font-medium text-foreground">Data utworzenia:</dt>
                  <dd className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formatPolishDate(product.createdAt, "d MMMM yyyy, HH:mm")}
                  </dd>
                </div>

                {/* Date of Update */}
                {hasDistinctUpdateDate && (
                  <div className="flex items-center gap-1.5">
                    <dt className="font-medium text-foreground">
                      Ostatnia modyfikacja:
                    </dt>
                    <dd className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {formatPolishDate(product.updatedAt, "d MMMM yyyy, HH:mm")}
                    </dd>
                  </div>
                )}
              </dl>

              {/* Action: Add Review */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setIsReviewFormOpen(true)}
                  disabled={isReviewFormOpen}
                  className="gap-1.5"
                >
                  <PlusCircle className="size-4" />
                  Napisz opinię dla tego produktu
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews or Review Form Section */}
      {isReviewFormOpen ? (
        <section aria-labelledby="review-form-heading" className="space-y-4">
          <div className="border-b border-border pb-3">
            <h2
              id="review-form-heading"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              Napisz swoją opinię
            </h2>
          </div>
          <Card className="border p-6 shadow-sm">
            <CardContent className="p-0">
              <ReviewForm
                productId={product.id}
                onSuccess={handleReviewSuccess}
                onCancel={handleCancelReview}
                autoFocus
              />
            </CardContent>
          </Card>
        </section>
      ) : (
        <section aria-labelledby="reviews-heading" className="space-y-4">
          <div className="border-b border-border pb-3">
            <h2
              id="reviews-heading"
              className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
            >
              Opinie użytkowników
              <Badge variant="outline" className="text-xs">
                {product.reviews.length}
              </Badge>
            </h2>
          </div>

          {/* Empty state when there are no reviews */}
          {product.reviews.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <MessageSquare className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Brak opinii dla tego produktu
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                Ten produkt nie ma jeszcze żadnych recenzji. Podziel się swoim
                doświadczeniem i pomóż innym w wyborze!
              </p>
              <div className="mt-5">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsReviewFormOpen(true)}
                >
                  Bądź pierwszą osobą, która doda recenzję
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* List of Reviews */}
              <div className="flex flex-col gap-4">
                {product.reviews.map((review) => {
                  const reviewerName =
                    review.user.name ||
                    review.user.email.split("@")[0] ||
                    "Anonimowy użytkownik";

                  return (
                    <Card key={review.id} className="border shadow-2xs">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {/* Reviewer identity & Date */}
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
                              {reviewerName.charAt(0)}
                            </div>
                            <div>
                              <CardTitle className="text-sm font-semibold text-foreground">
                                {reviewerName}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="size-3" />
                                {formatPolishDate(review.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Review Rating Stars */}
                          <StarRating rate={review.rate} />
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 pt-2">
                        {/* Review Description cut off above 5 lines using generic ReadMore component */}
                        <ReadMore text={review.description} maxLines={5} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Action: Add Review at bottom of review list */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setIsReviewFormOpen(true)}
                  disabled={isReviewFormOpen}
                  className="gap-1.5"
                >
                  <PlusCircle className="size-4" />
                  Napisz opinię dla tego produktu
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
