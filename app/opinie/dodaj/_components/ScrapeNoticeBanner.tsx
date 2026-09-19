"use client";

import { memo } from "react";
import { CheckCircle2, CircleAlert, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type ScrapedFieldType = "name" | "imageUrl" | "code" | "shop";

export const SCRAPE_BANNER_MESSAGES = {
  success: {
    title: "Pobrano wszystkie potrzebne dane produktu",
    description:
      "Poniższe dane możesz sprawdzić i dowolnie edytować przed dodaniem opinii.",
  },
  failed: {
    title: "Nie udało się pobrać danych",
    description: "Uzupełnij brakujące dane i dodaj swoją opinię",
  },
  partial: {
    title: "Udało się pobrać część danych",
    description: "Uzupełnij brakujące dane i dodaj swoją opinię",
  },
} as const;

const allFields: ScrapedFieldType[] = ["name", "imageUrl", "code", "shop"];

interface ScrapeNoticeBannerProps {
  mode: "scraped_success" | "scraped_failed";
  scrapedFields?: ScrapedFieldType[];
  errorMessage?: string | null;
}

const MemoizedScrapeNoticeBanner = memo(function MemoizedScrapeNoticeBanner({
  mode,
  scrapedFields = [],
}: ScrapeNoticeBannerProps) {
  const isScrapeFailed =
    mode === "scraped_failed" || scrapedFields.length === 0;
  if (isScrapeFailed) {
    return (
      <Alert variant="destructive">
        <CircleAlert className="size-4" />
        <AlertTitle className="text-sm font-semibold">
          {SCRAPE_BANNER_MESSAGES.failed.title}
        </AlertTitle>
        <AlertDescription className="mt-0.5 text-xs leading-relaxed sm:text-sm">
          {SCRAPE_BANNER_MESSAGES.failed.description}
        </AlertDescription>
      </Alert>
    );
  }

  const hasAllData = allFields.every((field) => scrapedFields.includes(field));

  if (hasAllData) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle className="text-sm font-semibold">
          {SCRAPE_BANNER_MESSAGES.success.title}
        </AlertTitle>
        <AlertDescription className="mt-0.5 text-xs sm:text-sm">
          {SCRAPE_BANNER_MESSAGES.success.description}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning">
      <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-sm font-semibold">
        {SCRAPE_BANNER_MESSAGES.partial.title}
      </AlertTitle>
      <AlertDescription className="mt-0.5 text-xs sm:text-sm">
        {SCRAPE_BANNER_MESSAGES.partial.description}
      </AlertDescription>
    </Alert>
  );
});

export function ScrapeNoticeBanner(props: ScrapeNoticeBannerProps) {
  return <MemoizedScrapeNoticeBanner {...props} />;
}
