"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormFieldCard } from "@/components/ui/form-field-card";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_FIELDS_MESSAGES } from "../ProductFields";
import type { ProductCreateInput } from "@/schemas/product";

interface ProductNameFieldProps {
  showStatus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ProductNameField({
  showStatus = false,
  disabled = false,
  className,
}: ProductNameFieldProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductCreateInput>();

  const nameValue = useWatch({ control, name: "name" });
  const isFilled = Boolean(nameValue && nameValue.trim().length > 0);

  return (
    <FormFieldCard
      label={PRODUCT_FIELDS_MESSAGES.nameLabel}
      htmlFor="product-name"
      isFilled={isFilled}
      showStatus={showStatus}
      filledBadgeText={PRODUCT_FIELDS_MESSAGES.statusFilled}
      missingBadgeText={PRODUCT_FIELDS_MESSAGES.statusMissing}
      error={errors.name?.message}
      className={className}
      reserveSpace
    >
      <Textarea
        id="product-name"
        rows={1}
        placeholder={PRODUCT_FIELDS_MESSAGES.namePlaceholder}
        disabled={disabled}
        aria-invalid={!!errors.name}
        className="min-h-11 resize-none overflow-hidden bg-white py-2.5 text-base sm:text-sm dark:bg-card"
        {...register("name")}
      />
    </FormFieldCard>
  );
}
