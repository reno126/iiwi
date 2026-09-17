import { memo } from "react";
import { Star } from "lucide-react";
import { cn } from "cn";

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
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div
        className="flex items-center"
        aria-label={`Ocena: ${currentRate} na ${maxStars}`}
      >
        {Array.from({ length: maxStars }, (_, i) => {
          const isFilled = i < Math.round(currentRate);
          return (
            <Star
              key={i}
              className={cn(
                starSizes[size],
                isFilled
                  ? "fill-amber-400 text-amber-500"
                  : "text-muted-foreground/30",
              )}
              aria-hidden="true"
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
          {currentRate.toFixed(1)} / {maxStars}
        </span>
      )}
    </div>
  );
});

export function StarRating(props: StarRatingProps) {
  return <MemoizedStarRating {...props} />;
}
