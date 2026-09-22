import { MessageSquare } from "lucide-react";
import { StarRating } from "@/components/reviews/StarRating";
import { formatReviewCount } from "@/lib/formatters";
import { cn } from "cn";

export interface RatingSummaryProps {
  rate: number;
  count: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  showEmptyText?: boolean;
  emptyText?: string;
  className?: string;
}

export function RatingSummary({
  rate,
  count,
  size = "sm",
  showCount = true,
  showEmptyText = false,
  emptyText = "Brak ocen",
  className,
}: RatingSummaryProps) {
  const iconSize =
    size === "sm" ? "size-3.5" : size === "md" ? "size-4" : "size-5";
  const textSize =
    size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";

  if (count === 0 && showEmptyText) {
    return (
      <div
        data-slot="rating-summary"
        className={cn(
          "flex items-center gap-2",
          textSize,
          "text-muted-foreground",
          className,
        )}
      >
        <span>{emptyText}</span>
        {showCount && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <MessageSquare
                className={cn(iconSize, "text-muted-foreground")}
              />
              {formatReviewCount(count)}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      data-slot="rating-summary"
      className={cn(
        "flex flex-wrap items-center gap-2 sm:gap-3",
        textSize,
        className,
      )}
    >
      {count > 0 && <StarRating rate={rate} size={size} showValue />}

      {showCount && (
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <MessageSquare className={cn(iconSize, "text-muted-foreground")} />
          {formatReviewCount(count)}
        </span>
      )}
    </div>
  );
}
