"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "cn";

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
  const activeRating = hovered ?? (value ?? 0);

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Ocena w gwiazdkach"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = activeRating > 0 && star <= activeRating;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === value}
              aria-label={`${star} z 5 gwiazdek`}
              disabled={disabled}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              className="p-2 sm:p-1.5 text-muted-foreground transition-colors hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed touch-manipulation"
            >
              <Star
                className={cn(
                  "size-7 sm:size-6 transition-all",
                  isFilled
                    ? "fill-amber-400 text-amber-500 scale-105"
                    : "text-muted-foreground/40"
                )}
              />
            </button>
          );
        })}
      </div>

      {typeof value === "number" && value >= 1 && (
        <span className="text-sm sm:text-base font-semibold text-foreground">
          {value} / 5
        </span>
      )}
    </div>
  );
}
