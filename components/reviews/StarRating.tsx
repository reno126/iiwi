import { memo } from "react";
import { Star } from "lucide-react";
import { cn } from "cn";

export const STAR_RATING_MESSAGES = {
  ariaLabel: (rating: number, maxStars: number) =>
    `Ocena: ${rating} na ${maxStars}`,
  formattedValue: (rating: number, maxStars: number) =>
    `${rating.toFixed(1)} / ${maxStars}`,
} as const;

interface StarRatingProps {
  rating?: number;
  rate?: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const starSizes = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

const MemoizedStarRating = memo(function MemoizedStarRating({
  rating,
  rate,
  maxStars = 5,
  size = "sm",
  showValue = false,
  className,
}: StarRatingProps) {
  const currentRate = rating ?? rate ?? 0;

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      data-size={size}
    >
      <div
        className="flex items-center"
        role="meter"
        aria-label={STAR_RATING_MESSAGES.ariaLabel(currentRate, maxStars)}
        aria-valuenow={currentRate}
        aria-valuemin={0}
        aria-valuemax={maxStars}
        data-size={size}
      >
        {Array.from({ length: maxStars }, (_, index) => {
          const isFilled = index < Math.round(currentRate);
          return (
            <Star
              key={index}
              className={cn(
                starSizes[size],
                isFilled
                  ? "fill-amber-400 text-amber-500"
                  : "text-muted-foreground/30",
              )}
              aria-hidden="true"
              data-state={isFilled ? "filled" : "empty"}
            />
          );
        })}
      </div>
      {showValue && (
        <span
          className={cn(
            "ml-1 font-semibold text-foreground",
            size === "md" ? "text-base" : "text-sm",
          )}
        >
          {STAR_RATING_MESSAGES.formattedValue(currentRate, maxStars)}
        </span>
      )}
    </div>
  );
});

export function StarRating(props: StarRatingProps) {
  return <MemoizedStarRating {...props} />;
}
