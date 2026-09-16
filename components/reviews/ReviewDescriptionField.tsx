"use client";

import { useFormContext } from "react-hook-form";
import { FormFieldCard } from "@/components/ui/form-field-card";
import { Textarea } from "@/components/ui/textarea";
import { REVIEW_FIELDS_MESSAGES } from "./ReviewFields";
import type { ReviewCreateInput } from "@/schemas/review";

interface ReviewDescriptionFieldProps {
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ReviewDescriptionField({
  autoFocus = false,
  disabled,
  className,
}: ReviewDescriptionFieldProps) {
  const {
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<ReviewCreateInput>();

  const isDisabled = disabled ?? isSubmitting;

  return (
    <FormFieldCard
      label={REVIEW_FIELDS_MESSAGES.descriptionLabel}
      htmlFor="review-description"
      error={errors.description?.message}
      reserveSpace
      className={className}
    >
      <Textarea
        id="review-description"
        rows={4}
        placeholder={REVIEW_FIELDS_MESSAGES.descriptionPlaceholder}
        disabled={isDisabled}
        autoFocus={autoFocus}
        aria-invalid={!!errors.description}
        className="min-h-28 text-base sm:text-sm"
        {...register("description")}
      />
    </FormFieldCard>
  );
}
