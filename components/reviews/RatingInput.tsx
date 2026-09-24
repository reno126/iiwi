"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "cn";

import { RATING_INPUT_MESSAGES } from "./ratingInputMessages";

export { RATING_INPUT_MESSAGES };

interface RatingInputProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

export function RatingInput({
  value,
  onChange,
  disabled = false,
}: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const activeRating = hovered ?? value ?? 0;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label={RATING_INPUT_MESSAGES.radiogroupAriaLabel}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = activeRating > 0 && star <= activeRating;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === value}
              aria-label={RATING_INPUT_MESSAGES.starAriaLabel(star)}
              disabled={disabled}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer touch-manipulation rounded-md p-2 text-muted-foreground transition-colors hover:text-amber-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed sm:p-1.5"
            >
              <Star
                className={cn(
                  "size-7 transition-all sm:size-6",
                  isFilled
                    ? "scale-105 fill-amber-400 text-amber-500"
                    : "text-muted-foreground/40",
                )}
              />
            </button>
          );
        })}
      </div>

      {typeof value === "number" && value >= 1 && (
        <span className="text-sm font-semibold whitespace-nowrap text-foreground sm:text-base">
          {value} / 5
        </span>
      )}
    </div>
  );
}
