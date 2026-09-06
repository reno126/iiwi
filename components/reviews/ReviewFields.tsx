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
import { cn } from "@/lib/shadcn/utils";

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
          <FieldError
            role={errors.rate ? "alert" : undefined}
            aria-hidden={!errors.rate}
            className={cn(
              "min-h-5 text-sm font-normal text-destructive leading-tight",
              !errors.rate && "invisible",
            )}
          >
            {errors.rate?.message || "\u00A0"}
          </FieldError>
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="review-description">Treść recenzji *</FieldLabel>
          <Textarea
            id="review-description"
            rows={4}
            placeholder="Napisz, jak oceniasz ten produkt..."
            disabled={isSubmitting}
            autoFocus={autoFocusDescription}
            aria-invalid={!!errors.description}
            {...register("description")}
          />
          <FieldError
            role={errors.description ? "alert" : undefined}
            aria-hidden={!errors.description}
            className={cn(
              "min-h-5 text-sm font-normal text-destructive leading-tight",
              !errors.description && "invisible",
            )}
          >
            {errors.description?.message || "\u00A0"}
          </FieldError>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
