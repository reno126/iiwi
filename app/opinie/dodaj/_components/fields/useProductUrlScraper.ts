import { useState, useTransition } from "react";
import { useFormContext } from "react-hook-form";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import { PRODUCT_FIELDS_MESSAGES } from "../ProductFields";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import type { ProductCreateInput } from "@/schemas/product";

interface UseProductUrlScraperOptions {
  externalIsPending?: boolean;
  externalStartTransition?: ReturnType<typeof useTransition>[1];
  onScrapeSuccess?: (shop: MatchedShopResult | null) => void;
  onScrapeFinished?: () => void;
}

export function useProductUrlScraper({
  externalIsPending,
  externalStartTransition,
  onScrapeSuccess,
  onScrapeFinished,
}: UseProductUrlScraperOptions = {}) {
  const { setValue, getValues } = useFormContext<ProductCreateInput>();

  const [internalPending, internalStartTransition] = useTransition();
  const isPending = externalIsPending ?? internalPending;
  const effectiveStartTransition =
    externalStartTransition ?? internalStartTransition;

  const [isTier2NoticeVisible, setIsTier2NoticeVisible] = useState(false);
  const [scrapeNotice, setScrapeNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const scrape = () => {
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
            setValue("imageUrl", imageUrl, {
              shouldValidate: true,
              shouldDirty: true,
            });
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
            setValue("shopId", shop.id, {
              shouldValidate: true,
              shouldDirty: true,
            });
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

  return {
    isPending,
    isTier2NoticeVisible,
    scrapeNotice,
    scrape,
  };
}
