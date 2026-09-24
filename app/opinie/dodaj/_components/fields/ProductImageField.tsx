"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormFieldCard } from "@/components/ui/form-field-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, ImageOff } from "lucide-react";
import { PRODUCT_FIELDS_MESSAGES } from "../ProductFields";
import type { ProductCreateInput } from "@/schemas/product";

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

  const [showPreviewOnly, setShowPreviewOnly] = useState<boolean>(() =>
    Boolean(imageUrlValue?.trim()),
  );
  const [prevImageUrlValue, setPrevImageUrlValue] = useState(imageUrlValue);
  const [imageLoadError, setImageLoadError] = useState(false);

  if (prevImageUrlValue !== imageUrlValue) {
    setPrevImageUrlValue(imageUrlValue);
    if (imageUrlValue && !prevImageUrlValue) {
      setShowPreviewOnly(true);
      setImageLoadError(false);
    }
  }

  const handleClearImage = () => {
    setValue("imageUrl", "", { shouldValidate: true, shouldDirty: true });
    setImageLoadError(false);
    setShowPreviewOnly(false);
  };

  const isPreview = Boolean(showPreviewOnly && imageUrlValue);

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
      {isPreview ? (
        <>
          <input type="hidden" {...register("imageUrl")} />
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-white p-2.5 shadow-2xs sm:flex-row dark:bg-card">
            <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
              {imageLoadError ? (
                <ImageOff className="size-6 text-muted-foreground" />
              ) : (
                <img
                  src={imageUrlValue}
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
                {imageUrlValue}
              </span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={disabled}
              onClick={handleClearImage}
            >
              <Trash2 className="mr-1 size-3.5" />
              {PRODUCT_FIELDS_MESSAGES.deleteImageButton}
            </Button>
          </div>
        </>
      ) : (
        <Input
          id="product-image"
          type="url"
          inputMode="url"
          disabled={disabled}
          aria-invalid={!!errors.imageUrl}
          className="h-11 bg-white text-base sm:text-sm dark:bg-card"
          placeholder={PRODUCT_FIELDS_MESSAGES.imageUrlPlaceholder}
          {...register("imageUrl")}
        />
      )}
    </FormFieldCard>
  );
}
