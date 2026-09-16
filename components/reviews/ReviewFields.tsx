"use client";

import { FieldSet, FieldLegend, FieldGroup } from "@/components/ui/field";
import { ReviewRatingField } from "./ReviewRatingField";
import { ReviewDescriptionField } from "./ReviewDescriptionField";

export const REVIEW_FIELDS_MESSAGES = {
  legend: "Twoja opinia",
  rateLabel: "Ocena *",
  descriptionLabel: "Treść recenzji *",
  descriptionPlaceholder: "Napisz, jak oceniasz ten produkt...",
} as const;

interface ReviewFieldsProps {
  className?: string;
  legend?: string;
  autoFocusDescription?: boolean;
}

export function ReviewFields({
  className,
  legend = REVIEW_FIELDS_MESSAGES.legend,
  autoFocusDescription = false,
}: ReviewFieldsProps) {
  return (
    <FieldSet className={className}>
      {legend && <FieldLegend>{legend}</FieldLegend>}
      <FieldGroup className="gap-3 sm:gap-4">
        <ReviewRatingField />
        <ReviewDescriptionField autoFocus={autoFocusDescription} />
      </FieldGroup>
    </FieldSet>
  );
}
