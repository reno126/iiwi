import { memo } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/StarRating";
import { AuthorSignature } from "@/components/reviews/AuthorSignature";
import { ReadMore } from "./ReadMore";

interface ReviewItemUser {
  name?: string | null;
  email: string;
}

export interface ReviewItemData {
  id: string;
  rate: number;
  description: string;
  createdAt: Date;
  user: ReviewItemUser;
}

interface ProductReviewItemProps {
  review: ReviewItemData;
}

const MemoizedProductReviewItem = memo(function MemoizedProductReviewItem({
  review,
}: ProductReviewItemProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-xs transition-shadow hover:shadow-sm">
      <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <AuthorSignature
            name={review.user.name}
            email={review.user.email}
            date={review.createdAt}
            fallbackName="Anonimowy użytkownik"
          />

          <StarRating rate={review.rate} showValue />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 sm:p-5 sm:pt-2">
        <ReadMore text={review.description} maxLines={3} />
      </CardContent>
    </Card>
  );
});

export function ProductReviewItem({ review }: ProductReviewItemProps) {
  return <MemoizedProductReviewItem review={review} />;
}
