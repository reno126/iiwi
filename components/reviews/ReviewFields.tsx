"use client";

import { useFormContext, Controller } from "react-hook-form";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { RatingInput } from "./RatingInput";
import type { ReviewCreateInput } from "@/schemas/review";

interface ReviewFieldsProps {
  className?: string;
  legend?: string;
}

export function ReviewFields({
  className,
  legend = "Twoja opinia",
}: ReviewFieldsProps) {
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = useFormContext<ReviewCreateInput>();

  return (
    <FieldSet className={className}>
      <FieldLegend>{legend}</FieldLegend>
      <FieldGroup>
        <Field data-invalid={!!errors.rate}>
          <FieldLabel>Ocena *</FieldLabel>
          <Controller
            name="rate"
            control={control}
            render={({ field }) => (
              <RatingInput
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
          {errors.rate?.message && (
            <FieldError>{errors.rate.message}</FieldError>
          )}
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="review-description">Treść recenzji *</FieldLabel>
          <Textarea
            id="review-description"
            rows={4}
            placeholder="Napisz, jak oceniasz ten produkt..."
            disabled={isSubmitting}
            {...register("description")}
          />
          {errors.description?.message && (
            <FieldError>{errors.description.message}</FieldError>
          )}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
