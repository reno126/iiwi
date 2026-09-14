"use client";

import { useState, useTransition, useCallback } from "react";
import {
  productScrapeMetadata,
  type ScrapedMetadataResult,
} from "@/serverActions/productScrapeMetadata";

export interface ScrapeNotice {
  type: "success" | "error";
  message: string;
}

export function useProductScrape() {
  const [isPending, startTransition] = useTransition();
  const [isTier2NoticeVisible, setIsTier2NoticeVisible] = useState(false);
  const [scrapeNotice, setScrapeNotice] = useState<ScrapeNotice | null>(null);

  const scrapeUrl = useCallback(
    async (
      inputUrl: string,
      onSuccess?: (data: ScrapedMetadataResult) => void,
      onError?: (errorMessage: string) => void,
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
            "Nie udało się pobrać informacji o produkcie. Możesz uzupełnić dane ręcznie.";

          setScrapeNotice({ type: "error", message: errorMsg });
          if (onError) {
            onError(errorMsg);
          }
        } catch {
          const fallbackErr =
            "Wystąpił nieoczekiwany błąd podczas pobierania danych.";
          setScrapeNotice({ type: "error", message: fallbackErr });
          if (onError) {
            onError(fallbackErr);
          }
        } finally {
          clearTimeout(timer);
          setIsTier2NoticeVisible(false);
        }
      });
    },
    [],
  );

  return {
    isPending,
    isTier2NoticeVisible,
    scrapeNotice,
    setScrapeNotice,
    scrapeUrl,
  };
}
