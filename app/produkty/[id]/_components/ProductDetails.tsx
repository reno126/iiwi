"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageSquare, PlusCircle } from "lucide-react";
import type { ProductWithReviews } from "@/serverActions/productGetById";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { StarRating } from "@/components/reviews/StarRating";
import { ProductOverviewCard } from "./ProductOverviewCard";
import { ProductReviewItem } from "./ProductReviewItem";
import { getReviewDraft } from "@/lib/storage/reviewDraftStorage";
import { cn } from "cn";

export { StarRating };

export const PRODUCT_DETAILS_MESSAGES = {
  backToList: "Wróć do listy produktów",
  formHeading: "Napisz swoją opinię",
  reviewsHeading: "Opinie użytkowników",
  emptyTitle: "Brak opinii dla tego produktu",
  emptyDescription:
    "Ten produkt nie ma jeszcze żadnych recenzji. Podziel się swoim doświadczeniem i pomóż innym w wyborze!",
  firstReviewButton: "Bądź pierwszą osobą, która doda recenzję",
  addReviewButton: "Napisz opinię dla tego produktu",
} as const;

export interface ProductDetailsProps {
  product: ProductWithReviews;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter();
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(() => {
    function checkInitialReviewFormOpenState(): boolean {
      const draft = getReviewDraft();
      return Boolean(
        draft?.type === "REVIEW_EXISTING_PRODUCT" &&
          draft.productId === product.id,
      );
    }
    return checkInitialReviewFormOpenState();
  });

  useEffect(() => {
    function scrollToReviewFormIfDraftExists() {
      const draft = getReviewDraft();
      const hasDraftForCurrentProduct =
        draft?.type === "REVIEW_EXISTING_PRODUCT" &&
        draft.productId === product.id;

      if (!hasDraftForCurrentProduct) {
        return;
      }

      const reviewFormElement = document.getElementById("review-form");
      reviewFormElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    scrollToReviewFormIfDraftExists();
  }, [product.id]);

  const handleReviewSuccess = () => {
    setIsReviewFormOpen(false);
    router.refresh();
  };

  const handleCancelReview = () => {
    setIsReviewFormOpen(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <div>
        <Link
          href="/produkty"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 gap-1.5 text-muted-foreground hover:text-foreground",
          )}
        >
          <ChevronLeft className="size-4" />
          {PRODUCT_DETAILS_MESSAGES.backToList}
        </Link>
      </div>

      <ProductOverviewCard
        product={product}
        onAddReview={() => setIsReviewFormOpen(true)}
        isReviewFormOpen={isReviewFormOpen}
      />

      {isReviewFormOpen ? (
        <section
          id="review-form"
          aria-labelledby="review-form-heading"
          className="space-y-4"
        >
          <div className="border-b border-border pb-3">
            <h2
              id="review-form-heading"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              {PRODUCT_DETAILS_MESSAGES.formHeading}
            </h2>
          </div>
          <Card className="border p-6 shadow-sm">
            <CardContent className="p-0">
              <ReviewForm
                productId={product.id}
                product={product}
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
              {PRODUCT_DETAILS_MESSAGES.reviewsHeading}
              <Badge variant="outline" className="text-xs">
                {product.reviews.length}
              </Badge>
            </h2>
          </div>

          {product.reviews.length === 0 ? (
            <Empty className="border p-8 text-center">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageSquare className="size-6" />
                </EmptyMedia>
                <EmptyTitle>{PRODUCT_DETAILS_MESSAGES.emptyTitle}</EmptyTitle>
                <EmptyDescription>
                  {PRODUCT_DETAILS_MESSAGES.emptyDescription}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsReviewFormOpen(true)}
                >
                  {PRODUCT_DETAILS_MESSAGES.firstReviewButton}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                {product.reviews.map((review) => (
                  <ProductReviewItem key={review.id} review={review} />
                ))}
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setIsReviewFormOpen(true)}
                  disabled={isReviewFormOpen}
                  className="gap-1.5"
                >
                  <PlusCircle className="size-4" />
                  {PRODUCT_DETAILS_MESSAGES.addReviewButton}
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
