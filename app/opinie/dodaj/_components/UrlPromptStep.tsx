"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ScrapeDelayNotice } from "./ScrapeDelayNotice";
import { Sparkles, ArrowLeft } from "lucide-react";

export const URL_PROMPT_MESSAGES = {
  subtitle: "wklej go poniżej, to pójdzie szybko!",
  placeholder: "https://sklep.pl/produkt...",
  urlInputAriaLabel: "Link do oferty produktu",
  scrapeButton: "Pobierz info",
  noLinkQuestion: "Nie masz linku do oferty?",
  manualButton: "Dodaj produkt ręcznie",
  manualHint: "wymagamy tylko nazwy, no i opinii",
  backButton: "Wróć do wyszukiwania",
} as const;

interface UrlPromptStepProps {
  onScrape: (url: string) => void;
  onManualSelect: () => void;
  onCancel?: () => void;
  isPending: boolean;
  isTier2NoticeVisible: boolean;
  initialUrl?: string;
}

export function UrlPromptStep({
  onScrape,
  onManualSelect,
  onCancel,
  isPending,
  isTier2NoticeVisible,
  initialUrl = "",
}: UrlPromptStepProps) {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onScrape(trimmed);
  };

  return (
    <div className="space-y-6">
      <div className="">
        <p className="text-sm text-muted-foreground">
          {URL_PROMPT_MESSAGES.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={URL_PROMPT_MESSAGES.placeholder}
            aria-label={URL_PROMPT_MESSAGES.urlInputAriaLabel}
            autoFocus
            disabled={isPending}
            className="h-11 flex-1 text-base sm:text-sm"
          />
          <Button
            type="submit"
            disabled={isPending || !url.trim()}
            className="h-11 px-6 shrink-0 gap-2 font-medium"
          >
            {isPending ? (
              <Spinner className="size-4" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {URL_PROMPT_MESSAGES.scrapeButton}
          </Button>
        </div>

        <ScrapeDelayNotice
          isVisible={isPending && isTier2NoticeVisible}
          className="justify-center pt-1"
        />
      </form>

      <div className="border-t pt-6 text-center space-y-2">
        <span className="block text-sm font-medium text-foreground">
          {URL_PROMPT_MESSAGES.noLinkQuestion}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={onManualSelect}
          disabled={isPending}
          className="mx-auto"
        >
          {URL_PROMPT_MESSAGES.manualButton}
        </Button>
        <span className="block text-xs text-muted-foreground">
          {URL_PROMPT_MESSAGES.manualHint}
        </span>
      </div>

      {onCancel && (
        <div className="text-center pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            {URL_PROMPT_MESSAGES.backButton}
          </Button>
        </div>
      )}
    </div>
  );
}
