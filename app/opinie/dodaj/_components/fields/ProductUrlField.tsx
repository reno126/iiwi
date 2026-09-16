"use client";

import { useState, useTransition } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormFieldCard } from "@/components/ui/form-field-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles, CircleAlert, CheckCircle2 } from "lucide-react";
import { ScrapeDelayNotice } from "../ScrapeDelayNotice";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import { shopMatchByUrlAction } from "@/serverActions/shopMatchByUrlAction";
import { PRODUCT_FIELDS_MESSAGES } from "../ProductFields";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import type { ProductCreateInput } from "@/schemas/product";

interface ProductUrlFieldProps {
  hideProductUrl?: boolean;
  isPending?: boolean;
  startTransition?: ReturnType<typeof useTransition>[1];
  onScrapeSuccess?: (shop: MatchedShopResult | null) => void;
  onShopMatched?: (shop: MatchedShopResult) => void;
  onScrapeFinished?: () => void;
  className?: string;
}

export function ProductUrlField({
  hideProductUrl = false,
  isPending: externalIsPending,
  startTransition: externalStartTransition,
  onScrapeSuccess,
  onShopMatched,
  onScrapeFinished,
  className,
}: ProductUrlFieldProps) {
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<ProductCreateInput>();

  const productUrlValue = useWatch({ control, name: "productUrl" });

  const [internalPending, internalStartTransition] = useTransition();
  const effectiveIsPending = externalIsPending ?? internalPending;
  const effectiveStartTransition = externalStartTransition ?? internalStartTransition;

  const [isTier2NoticeVisible, setIsTier2NoticeVisible] = useState(false);
  const [scrapeNotice, setScrapeNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  if (hideProductUrl) {
    return <input type="hidden" {...register("productUrl")} />;
  }

  const handleUrlBlur = async () => {
    const currentShopId = getValues("shopId");
    if (currentShopId) return;

    const rawUrl = (getValues("productUrl") || "").trim();
    if (!rawUrl) return;

    try {
      const res = await shopMatchByUrlAction({ url: rawUrl });
      if (res?.data) {
        setValue("shopId", res.data.id, { shouldValidate: true, shouldDirty: true });
        onShopMatched?.(res.data);
      }
    } catch {
      return;
    }
  };

  const handleScrape = () => {
    let url = (getValues("productUrl") || "").trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
      setValue("productUrl", url, { shouldValidate: true, shouldDirty: true });
    }

    setScrapeNotice(null);
    setIsTier2NoticeVisible(false);

    const timer = setTimeout(() => {
      setIsTier2NoticeVisible(true);
    }, 2500);

    effectiveStartTransition(async () => {
      try {
        const res = await productScrapeMetadata({ productUrl: url });

        if (res?.serverError) {
          setScrapeNotice({ type: "error", message: res.serverError });
          return;
        }

        if (res?.validationErrors) {
          const fieldError = res.validationErrors.fieldErrors?.productUrl?.[0];
          const formError = res.validationErrors.formErrors?.[0];
          setScrapeNotice({
            type: "error",
            message:
              fieldError ||
              formError ||
              PRODUCT_FIELDS_MESSAGES.scrapeInvalidUrl,
          });
          return;
        }

        if (res?.data) {
          const { imageUrl, name, code, shop } = res.data;

          if (imageUrl) {
            setValue("imageUrl", imageUrl, { shouldValidate: true, shouldDirty: true });
          }

          const currentName = (getValues("name") || "").trim();
          if (!currentName && name) {
            setValue("name", name, { shouldValidate: true, shouldDirty: true });
          }

          const currentCode = (getValues("code") || "").trim();
          if (!currentCode && code) {
            setValue("code", code, { shouldValidate: true, shouldDirty: true });
          }

          if (shop) {
            setValue("shopId", shop.id, { shouldValidate: true, shouldDirty: true });
          }

          onScrapeSuccess?.(shop ?? null);

          setScrapeNotice({
            type: "success",
            message: imageUrl
              ? PRODUCT_FIELDS_MESSAGES.scrapeSuccessWithImage
              : PRODUCT_FIELDS_MESSAGES.scrapeSuccessWithoutImage,
          });
        }
      } catch (err: unknown) {
        setScrapeNotice({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : PRODUCT_FIELDS_MESSAGES.scrapeUnexpectedError,
        });
      } finally {
        clearTimeout(timer);
        setIsTier2NoticeVisible(false);
        onScrapeFinished?.();
      }
    });
  };

  return (
    <FormFieldCard
      label={PRODUCT_FIELDS_MESSAGES.productUrlLabel}
      htmlFor="product-url"
      error={errors.productUrl?.message}
      className={className}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          id="product-url"
          type="url"
          inputMode="url"
          aria-invalid={!!errors.productUrl}
          placeholder={PRODUCT_FIELDS_MESSAGES.productUrlPlaceholder}
          className="h-11 text-base sm:text-sm flex-1"
          {...register("productUrl", {
            onBlur: handleUrlBlur,
          })}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleScrape}
          disabled={effectiveIsPending || !productUrlValue?.trim()}
          className="h-11 sm:h-11 shrink-0 font-medium"
        >
          {effectiveIsPending ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <Sparkles className="mr-2 size-4 text-primary" />
          )}
          {PRODUCT_FIELDS_MESSAGES.scrapeButton}
        </Button>
      </div>

      <ScrapeDelayNotice
        isVisible={effectiveIsPending && isTier2NoticeVisible}
        className="mt-2"
      />

      {scrapeNotice && (
        <Alert
          variant={scrapeNotice.type === "error" ? "destructive" : "success"}
          className="mt-2 text-xs py-2 px-3"
        >
          {scrapeNotice.type === "error" ? (
            <CircleAlert className="size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0" />
          )}
          <AlertDescription className="text-xs leading-relaxed">
            {scrapeNotice.message}
          </AlertDescription>
        </Alert>
      )}
    </FormFieldCard>
  );
}
