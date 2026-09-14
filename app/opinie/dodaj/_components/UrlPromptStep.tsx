"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ScrapeDelayNotice } from "@/components/products/ScrapeDelayNotice";
import {
  Sparkles,
  ArrowLeft,
  SmilePlus,
  FaceGrinningIcon,
  ScanFaceIcon,
} from "lucide-react";

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
      {/* 1. Element 1: Nagłówek i podtytuł mniejszymi literami */}
      <div className="">
        <p className="text-sm text-muted-foreground">
          wklej go poniżej, to pójdzie szybko!
        </p>
      </div>

      {/* 2. & 3. Element 2 (pole do url) + Element 3 (przycisk: Pobierz info) */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://sklep.pl/produkt..."
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
            Pobierz info
          </Button>
        </div>

        {/* Informacja o wydłużonym czasie Tier 2 */}
        <ScrapeDelayNotice
          isVisible={isPending && isTier2NoticeVisible}
          className="justify-center pt-1"
        />
      </form>

      {/* Opcja alternatywna: brak linku / dodawanie ręczne */}
      <div className="border-t pt-6 text-center space-y-2">
        <span className="block text-sm font-medium text-foreground">
          Nie masz linku do oferty?
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={onManualSelect}
          disabled={isPending}
          className="mx-auto"
        >
          Dodaj produkt ręcznie
        </Button>
        <span className="block text-xs text-muted-foreground">
          wymagamy tylko nazwy, no i opinii
        </span>
      </div>

      {/* Powrót do wyszukiwania w bazie */}
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
            Wróć do wyszukiwania
          </Button>
        </div>
      )}
    </div>
  );
}
