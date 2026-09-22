"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ProductWithReviews } from "@/serverActions/productGetById";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { StarRating } from "@/components/reviews/StarRating";
import { ProductOverviewCard } from "./ProductOverviewCard";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { Heading } from "@/components/ui/heading";
import { SectionHeader } from "@/components/ui/page-header";
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
    const draft = getReviewDraft();
    return Boolean(
      draft?.type === "REVIEW_EXISTING_PRODUCT" &&
        draft.productId === product.id,
    );
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

  const handleOpenReviewForm = useCallback(() => {
    setIsReviewFormOpen(true);
  }, []);

  const handleReviewSuccess = useCallback(() => {
    setIsReviewFormOpen(false);
    router.refresh();
  }, [router]);

  const handleCancelReview = useCallback(() => {
    setIsReviewFormOpen(false);
  }, []);

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
        onAddReview={handleOpenReviewForm}
        isReviewFormOpen={isReviewFormOpen}
      />

      {isReviewFormOpen ? (
        <section
          id="review-form"
          aria-labelledby="review-form-heading"
          className="space-y-4"
        >
          <SectionHeader bordered={true}>
            <Heading id="review-form-heading" level={2} size="xl">
              {PRODUCT_DETAILS_MESSAGES.formHeading}
            </Heading>
          </SectionHeader>
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
        <ProductReviewsSection
          reviews={product.reviews}
          onOpenReviewForm={handleOpenReviewForm}
          isReviewFormOpen={isReviewFormOpen}
        />
      )}
    </div>
  );
}
