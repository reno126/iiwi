import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StarRating } from "@/components/reviews/StarRating";
import { ReadMore } from "@/components/ReadMore";
import { Calendar } from "lucide-react";
import { formatPolishDate } from "@/lib/formatters";

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

export function ProductReviewItem({ review }: ProductReviewItemProps) {
  const reviewerName =
    review.user.name ||
    review.user.email.split("@")[0] ||
    "Anonimowy użytkownik";

  return (
    <Card className="border shadow-2xs">
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Reviewer identity & Date */}
          <div className="flex items-center gap-2.5">
            <Avatar size="default">
              <AvatarFallback>
                {reviewerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
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
        <ReadMore text={review.description} maxLines={3} />
      </CardContent>
    </Card>
  );
}
