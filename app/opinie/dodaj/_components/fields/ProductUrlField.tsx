"use client";

import { useTransition } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormFieldCard } from "@/components/ui/form-field-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles, CircleAlert, CheckCircle2 } from "lucide-react";
import { ScrapeDelayNotice } from "../ScrapeDelayNotice";
import { shopMatchByUrlAction } from "@/serverActions/shopMatchByUrlAction";
import { PRODUCT_FIELDS_MESSAGES } from "../ProductFields";
import { useProductScrape } from "@/hooks/useProductScrape";
import { populateScrapedFields } from "../populateScrapedFields";
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

  const {
    isPending,
    isTier2NoticeVisible,
    scrapeNotice,
    setScrapeNotice,
    scrapeUrl,
  } = useProductScrape({
    externalIsPending,
    externalStartTransition,
  });

  if (hideProductUrl) {
    return <input type="hidden" {...register("productUrl")} />;
  }

  const handleScrape = () => {
    let url = (getValues("productUrl") || "").trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
      setValue("productUrl", url, { shouldValidate: true, shouldDirty: true });
    }

    scrapeUrl(
      url,
      (data) => {
        populateScrapedFields({
          data,
          setValue,
          getValues,
          overwrite: false,
        });

        onScrapeSuccess?.(data.shop ?? null);

        setScrapeNotice({
          type: "success",
          message: data.imageUrl
            ? PRODUCT_FIELDS_MESSAGES.scrapeSuccessWithImage
            : PRODUCT_FIELDS_MESSAGES.scrapeSuccessWithoutImage,
        });
      },
      undefined,
      onScrapeFinished,
    );
  };

  const handleUrlBlur = async () => {
    const currentShopId = getValues("shopId");
    if (currentShopId) return;

    const rawUrl = (getValues("productUrl") || "").trim();
    if (!rawUrl) return;

    try {
      const res = await shopMatchByUrlAction({ url: rawUrl });
      if (res?.data) {
        setValue("shopId", res.data.id, {
          shouldValidate: true,
          shouldDirty: true,
        });
        onShopMatched?.(res.data);
      }
    } catch {
      return;
    }
  };

  return (
    <FormFieldCard
      label={PRODUCT_FIELDS_MESSAGES.productUrlLabel}
      htmlFor="product-url"
      error={errors.productUrl?.message}
      className={className}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="product-url"
          type="url"
          inputMode="url"
          aria-invalid={!!errors.productUrl}
          placeholder={PRODUCT_FIELDS_MESSAGES.productUrlPlaceholder}
          className="h-11 flex-1 text-base sm:text-sm"
          {...register("productUrl", {
            onBlur: handleUrlBlur,
          })}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleScrape}
          disabled={isPending || !productUrlValue?.trim()}
          className="h-11 shrink-0 font-medium sm:h-11"
        >
          {isPending ? (
            <Spinner className="mr-2 size-4" />
          ) : (
            <Sparkles className="mr-2 size-4 text-primary" />
          )}
          {PRODUCT_FIELDS_MESSAGES.scrapeButton}
        </Button>
      </div>

      <ScrapeDelayNotice
        isVisible={isPending && isTier2NoticeVisible}
        className="mt-2"
      />

      {scrapeNotice && (
        <Alert
          variant={scrapeNotice.type === "error" ? "destructive" : "success"}
          className="mt-2 px-3 py-2 text-xs"
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
