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
  autoFocusDescription?: boolean;
}

export function ReviewFields({
  className,
  legend = "Twoja opinia",
  autoFocusDescription = false,
}: ReviewFieldsProps) {
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = useFormContext<ReviewCreateInput>();

  return (
    <FieldSet className={className}>
      {legend && <FieldLegend>{legend}</FieldLegend>}
      <FieldGroup className="gap-3 sm:gap-4">
        <Field
          data-invalid={!!errors.rate}
          className="rounded-xl border border-border/80 bg-white p-3.5 sm:p-4 shadow-2xs transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"
        >
          <FieldLabel className="text-sm font-medium text-foreground">Ocena *</FieldLabel>
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
          <FieldError reserveSpace>{errors.rate?.message}</FieldError>
        </Field>

        <Field
          data-invalid={!!errors.description}
          className="rounded-xl border border-border/80 bg-white p-3.5 sm:p-4 shadow-2xs transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"
        >
          <FieldLabel htmlFor="review-description" className="text-sm font-medium text-foreground">
            Treść recenzji *
          </FieldLabel>
          <Textarea
            id="review-description"
            rows={4}
            placeholder="Napisz, jak oceniasz ten produkt..."
            disabled={isSubmitting}
            autoFocus={autoFocusDescription}
            aria-invalid={!!errors.description}
            className="min-h-28 text-base sm:text-sm"
            {...register("description")}
          />
          <FieldError reserveSpace>{errors.description?.message}</FieldError>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
