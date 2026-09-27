"use client";

import { useState, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormFieldCard } from "@/components/ui/form-field-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, ImageOff } from "lucide-react";
import { PRODUCT_FIELDS_MESSAGES } from "../ProductFields";
import type { ProductCreateInput } from "@/schemas/product";

interface ProductImagePreviewCardProps {
  imageUrl: string;
  disabled: boolean;
  onClear: () => void;
}

function ProductImagePreviewCard({
  imageUrl,
  disabled,
  onClear,
}: ProductImagePreviewCardProps) {
  const [imageLoadError, setImageLoadError] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-white p-2.5 shadow-2xs sm:flex-row dark:bg-card">
      <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
        {imageLoadError ? (
          <ImageOff className="size-6 text-muted-foreground" />
        ) : (
          <img
            key={imageUrl}
            src={imageUrl}
            alt={PRODUCT_FIELDS_MESSAGES.imagePreviewAlt}
            className="size-full object-contain"
            onError={() => setImageLoadError(true)}
            onLoad={() => setImageLoadError(false)}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-center sm:text-left">
        <span className="truncate text-xs font-medium text-foreground">
          {imageLoadError
            ? PRODUCT_FIELDS_MESSAGES.imageLoadError
            : PRODUCT_FIELDS_MESSAGES.imagePreviewAlt}
        </span>
        <span className="hidden truncate text-xs text-muted-foreground sm:inline">
          {imageUrl}
        </span>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={disabled}
        onClick={onClear}
      >
        <Trash2 className="mr-1 size-3.5" />
        {PRODUCT_FIELDS_MESSAGES.deleteImageButton}
      </Button>
    </div>
  );
}

interface ProductImageFieldProps {
  showStatus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ProductImageField({
  showStatus = false,
  disabled = false,
  className,
}: ProductImageFieldProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ProductCreateInput>();

  const imageUrlValue = useWatch({ control, name: "imageUrl" });
  const isImageFilled = Boolean(
    imageUrlValue && imageUrlValue.trim().length > 0,
  );

  const handleClearImage = useCallback(() => {
    setValue("imageUrl", "", { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  const isPreview = isImageFilled && Boolean(imageUrlValue);

  return (
    <FormFieldCard
      label={
        isPreview
          ? PRODUCT_FIELDS_MESSAGES.imagePreviewLabel
          : PRODUCT_FIELDS_MESSAGES.imageUrlLabel
      }
      htmlFor={isPreview ? undefined : "product-image"}
      isFilled={isImageFilled}
      showStatus={showStatus}
      filledBadgeText={PRODUCT_FIELDS_MESSAGES.statusFilled}
      missingBadgeText={PRODUCT_FIELDS_MESSAGES.statusMissing}
      error={errors.imageUrl?.message}
      className={className}
    >
      {isPreview && imageUrlValue ? (
        <>
          <input type="hidden" {...register("imageUrl")} />
          <ProductImagePreviewCard
            imageUrl={imageUrlValue}
            disabled={disabled}
            onClear={handleClearImage}
          />
        </>
      ) : (
        <Input
          id="product-image"
          type="url"
          inputMode="url"
          disabled={disabled}
          aria-invalid={!!errors.imageUrl}
          aria-describedby={errors.imageUrl ? "product-image-error" : undefined}
          className="h-11 bg-white text-base sm:text-sm dark:bg-card"
          placeholder={PRODUCT_FIELDS_MESSAGES.imageUrlPlaceholder}
          {...register("imageUrl")}
        />
      )}
    </FormFieldCard>
  );
}
