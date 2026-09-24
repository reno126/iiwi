"use client";

import { FieldSet, FieldLegend, FieldGroup } from "@/components/ui/field";
import { ReviewRatingField } from "./ReviewRatingField";
import { ReviewDescriptionField } from "./ReviewDescriptionField";

import { REVIEW_FIELDS_MESSAGES } from "./reviewFieldsMessages";

export { REVIEW_FIELDS_MESSAGES };

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
