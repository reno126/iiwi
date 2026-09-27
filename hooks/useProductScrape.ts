"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
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
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
    };
  }, []);

  const scrapeUrl = useCallback(
    async (
      inputUrl: string,
      onSuccess?: (data: ScrapedMetadataResult) => void,
      onError?: (errorMessage: string) => void,
      onFinished?: () => void,
    ) => {
      let targetUrl = inputUrl.trim();
      if (!targetUrl) return;

      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
      }

      setScrapeNotice(null);
      setIsTier2NoticeVisible(false);

      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }

      delayTimerRef.current = setTimeout(() => {
        setIsTier2NoticeVisible(true);
      }, 2500);

      startTransition(async () => {
        try {
          const actionResult = await productScrapeMetadata({
            productUrl: targetUrl,
          });

          if (actionResult?.data) {
            if (onSuccess) {
              onSuccess(actionResult.data);
            }
            return;
          }

          const resolvedErrorMessage =
            actionResult?.serverError ||
            actionResult?.validationErrors?.fieldErrors?.productUrl?.[0] ||
            actionResult?.validationErrors?.formErrors?.[0] ||
            PRODUCT_SCRAPE_HOOK_MESSAGES.fallbackError;

          setScrapeNotice({ type: "error", message: resolvedErrorMessage });
          if (onError) {
            onError(resolvedErrorMessage);
          }
        } catch {
          const fallbackErrorMessage =
            PRODUCT_SCRAPE_HOOK_MESSAGES.unexpectedError;
          setScrapeNotice({ type: "error", message: fallbackErrorMessage });
          if (onError) {
            onError(fallbackErrorMessage);
          }
        } finally {
          if (delayTimerRef.current) {
            clearTimeout(delayTimerRef.current);
            delayTimerRef.current = null;
          }
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
