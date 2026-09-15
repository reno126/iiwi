"use client";

import { CheckCircle2, CircleAlert, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type ScrapedFieldType = "name" | "imageUrl" | "code" | "shop";

const allFields: ScrapedFieldType[] = ["name", "imageUrl", "code", "shop"];

interface ScrapeNoticeBannerProps {
  mode: "scraped_success" | "scraped_failed";
  scrapedFields?: ScrapedFieldType[];
  errorMessage?: string | null;
}

export function ScrapeNoticeBanner({
  mode,
  scrapedFields = [],
}: ScrapeNoticeBannerProps) {
  const isScrapeFailed = mode === "scraped_failed" || scrapedFields.length === 0;
  if (isScrapeFailed) {
    return (
      <Alert variant="destructive">
        <CircleAlert className="size-4" />
        <AlertTitle className="font-semibold text-sm">
          Nie udało się pobrać danych
        </AlertTitle>
        <AlertDescription className="text-xs sm:text-sm leading-relaxed mt-0.5">
          Uzupełnij brakujące dane i dodaj swoją opinię
        </AlertDescription>
      </Alert>
    );
  }

  const hasAllData = allFields.every((field) => scrapedFields.includes(field));

  if (hasAllData) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle className="font-semibold text-sm">
          Pobrano wszystkie potrzebne dane produktu
        </AlertTitle>
        <AlertDescription className="text-xs sm:text-sm mt-0.5">
          Poniższe dane możesz sprawdzić i dowolnie edytować przed dodaniem
          opinii.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning">
      <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="font-semibold text-sm">
        Udało się pobrać część danych
      </AlertTitle>
      <AlertDescription className="text-xs sm:text-sm mt-0.5">
        Uzupełnij brakujące dane i dodaj swoją opinię
      </AlertDescription>
    </Alert>
  );
}
