"use client";

import { useState, useTransition, useCallback } from "react";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import type { ScrapedMetadataResult } from "@/schemas/productScrape";

export interface ScrapeNotice {
  type: "success" | "error";
  message: string;
}

export const PRODUCT_SCRAPE_HOOK_MESSAGES = {
  fallbackError:
    "Nie udało się pobrać informacji o produkcie. Możesz uzupełnić dane ręcznie.",
  unexpectedError: "Wystąpił nieoczekiwany błąd podczas pobierania danych.",
} as const;

export interface UseProductScrapeOptions {
  externalIsPending?: boolean;
  externalStartTransition?: ReturnType<typeof useTransition>[1];
}

export function useProductScrape({
  externalIsPending,
  externalStartTransition,
}: UseProductScrapeOptions = {}) {
  const [internalPending, internalStartTransition] = useTransition();
  const isPending = externalIsPending ?? internalPending;
  const startTransition = externalStartTransition ?? internalStartTransition;

  const [isTier2NoticeVisible, setIsTier2NoticeVisible] = useState(false);
  const [scrapeNotice, setScrapeNotice] = useState<ScrapeNotice | null>(null);

  const scrapeUrl = useCallback(
    async (
      inputUrl: string,
      onSuccess?: (data: ScrapedMetadataResult) => void,
      onError?: (errorMessage: string) => void,
      onFinished?: () => void,
    ) => {
      let url = inputUrl.trim();
      if (!url) return;

      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }

      setScrapeNotice(null);
      setIsTier2NoticeVisible(false);

      const timer = setTimeout(() => {
        setIsTier2NoticeVisible(true);
      }, 2500);

      startTransition(async () => {
        try {
          const res = await productScrapeMetadata({ productUrl: url });

          if (res?.data) {
            if (onSuccess) {
              onSuccess(res.data);
            }
            return;
          }

          const errorMsg =
            res?.serverError ||
            res?.validationErrors?.fieldErrors?.productUrl?.[0] ||
            res?.validationErrors?.formErrors?.[0] ||
            PRODUCT_SCRAPE_HOOK_MESSAGES.fallbackError;

          setScrapeNotice({ type: "error", message: errorMsg });
          if (onError) {
            onError(errorMsg);
          }
        } catch {
          const fallbackErr = PRODUCT_SCRAPE_HOOK_MESSAGES.unexpectedError;
          setScrapeNotice({ type: "error", message: fallbackErr });
          if (onError) {
            onError(fallbackErr);
          }
        } finally {
          clearTimeout(timer);
          setIsTier2NoticeVisible(false);
          if (onFinished) {
            onFinished();
          }
        }
      });
    },
    [startTransition],
  );

  return {
    isPending,
    isTier2NoticeVisible,
    scrapeNotice,
    setScrapeNotice,
    scrapeUrl,
  };
}
