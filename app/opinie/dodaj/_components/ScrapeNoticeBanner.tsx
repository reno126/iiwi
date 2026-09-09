"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export type ScrapedFieldType = "name" | "imageUrl" | "code" | "shop";

const FIELD_LABELS: Record<ScrapedFieldType, string> = {
  name: "Nazwa",
  imageUrl: "Zdjęcie",
  shop: "Sklep",
  code: "Kod / EAN",
};

interface ScrapeNoticeBannerProps {
  mode: "scraped_success" | "scraped_failed";
  scrapedFields?: ScrapedFieldType[];
  errorMessage?: string | null;
}

export function ScrapeNoticeBanner({
  mode,
  scrapedFields = [],
  errorMessage,
}: ScrapeNoticeBannerProps) {
  if (mode === "scraped_failed") {
    return (
      <Alert variant="destructive" className="border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20">
        <CircleAlert className="size-4" />
        <AlertTitle className="font-semibold text-sm">
          Nie udało się automatycznie pobrać danych
        </AlertTitle>
        <AlertDescription className="text-xs leading-relaxed mt-1">
          {errorMessage ||
            "Strona produktu nie udostępniła czytelnych metadanych lub jest zabezpieczona. Twój link został zachowany w formularzu – uzupełnij pozostałe dane ręcznie."}
        </AlertDescription>
      </Alert>
    );
  }

  // mode === "scraped_success"
  const hasImage = scrapedFields.includes("imageUrl");
  const hasName = scrapedFields.includes("name");

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/60 p-4 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-sm">Pobrano dane ze sklepu:</span>
            {scrapedFields.map((field) => (
              <Badge
                key={field}
                variant="outline"
                className="border-emerald-600/30 bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 text-xs py-0"
              >
                {FIELD_LABELS[field]}
              </Badge>
            ))}
          </div>

          <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
            {!hasImage && (
              <span className="block font-medium">
                • Nie udało się odnaleźć zdjęcia produktu – możesz dodać je ręcznie lub pozostawić puste.
              </span>
            )}
            {!hasName && (
              <span className="block font-medium">
                • Nie znaleziono nazwy produktu – prosimy o jej uzupełnienie w formularzu.
              </span>
            )}
            <span>Poniższe dane możesz sprawdzić i dowolnie edytować przed dodaniem opinii.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
