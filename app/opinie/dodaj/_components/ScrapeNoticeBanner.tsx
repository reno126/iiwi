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
  // Case 2: Nie udało się pobrać danych (błąd scrapowania lub 0 pobranych pól)
  if (mode === "scraped_failed" || scrapedFields.length === 0) {
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

  // Case 1: Pobrano wszystkie potrzebne dane produktu (statyczny baner sukcesu)
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

  // Case 3: Udało się pobrać część danych (co najmniej jedno pole, ale brakuje wymaganych danych)
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
