"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormFieldCard } from "@/components/ui/form-field-card";
import { Input } from "@/components/ui/input";
import { PRODUCT_FIELDS_MESSAGES } from "../ProductFields";
import type { ProductCreateInput } from "@/schemas/product";

interface ProductCodeFieldProps {
  showStatus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ProductCodeField({
  showStatus = false,
  disabled = false,
  className,
}: ProductCodeFieldProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductCreateInput>();

  const codeValue = useWatch({ control, name: "code" });
  const isFilled = Boolean(codeValue && codeValue.trim().length > 0);

  return (
    <FormFieldCard
      label={PRODUCT_FIELDS_MESSAGES.codeLabel}
      htmlFor="product-code"
      isFilled={isFilled}
      showStatus={showStatus}
      filledBadgeText={PRODUCT_FIELDS_MESSAGES.statusFilled}
      missingBadgeText={PRODUCT_FIELDS_MESSAGES.statusMissing}
      error={errors.code?.message}
      className={className}
    >
      <Input
        id="product-code"
        inputMode="numeric"
        placeholder={PRODUCT_FIELDS_MESSAGES.codePlaceholder}
        disabled={disabled}
        aria-invalid={!!errors.code}
        className="h-11 text-base sm:text-sm bg-white dark:bg-card"
        {...register("code")}
      />
    </FormFieldCard>
  );
}
