import { memo } from "react";
import { MessageSquare, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { ProductReviewItem } from "./ProductReviewItem";
import { PRODUCT_DETAILS_MESSAGES } from "./ProductDetails";
import type { ProductWithReviews } from "@/serverActions/productGetById";

interface ProductReviewsSectionProps {
  reviews: ProductWithReviews["reviews"];
  onOpenReviewForm: () => void;
  isReviewFormOpen: boolean;
}

const MemoizedProductReviewsSection = memo(
  function MemoizedProductReviewsSection({
    reviews,
    onOpenReviewForm,
    isReviewFormOpen,
  }: ProductReviewsSectionProps) {
    return (
      <section aria-labelledby="reviews-heading" className="space-y-4">
        <div className="border-b border-border pb-3">
          <h2
            id="reviews-heading"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground"
          >
            {PRODUCT_DETAILS_MESSAGES.reviewsHeading}
            <Badge variant="outline" className="text-xs">
              {reviews.length}
            </Badge>
          </h2>
        </div>

        {reviews.length === 0 ? (
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
              <Button type="button" size="sm" onClick={onOpenReviewForm}>
                {PRODUCT_DETAILS_MESSAGES.firstReviewButton}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <ProductReviewItem key={review.id} review={review} />
              ))}
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={onOpenReviewForm}
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
    );
  },
);

export function ProductReviewsSection({
  reviews,
  onOpenReviewForm,
  isReviewFormOpen,
}: ProductReviewsSectionProps) {
  return (
    <MemoizedProductReviewsSection
      reviews={reviews}
      onOpenReviewForm={onOpenReviewForm}
      isReviewFormOpen={isReviewFormOpen}
    />
  );
}
