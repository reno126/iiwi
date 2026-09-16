"use client";

import { useFormContext, Controller } from "react-hook-form";
import { FormFieldCard } from "@/components/ui/form-field-card";
import { RatingInput } from "./RatingInput";
import { REVIEW_FIELDS_MESSAGES } from "./ReviewFields";
import type { ReviewCreateInput } from "@/schemas/review";

interface ReviewRatingFieldProps {
  className?: string;
  disabled?: boolean;
}

export function ReviewRatingField({
  className,
  disabled,
}: ReviewRatingFieldProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext<ReviewCreateInput>();

  const isDisabled = disabled ?? isSubmitting;

  return (
    <FormFieldCard
      label={REVIEW_FIELDS_MESSAGES.rateLabel}
      error={errors.rate?.message}
      reserveSpace
      className={className}
    >
      <Controller
        name="rate"
        control={control}
        render={({ field }) => (
          <RatingInput
            value={field.value}
            onChange={field.onChange}
            disabled={isDisabled}
          />
        )}
      />
    </FormFieldCard>
  );
}
