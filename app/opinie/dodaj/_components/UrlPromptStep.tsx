"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BackButton } from "@/components/ui/back-link";
import { ScrapeDelayNotice } from "./ScrapeDelayNotice";
import { Sparkles } from "lucide-react";
import { useCombinedReviewFormContext } from "./CombinedReviewFormContext";

import { URL_PROMPT_MESSAGES } from "./urlPromptMessages";

export { URL_PROMPT_MESSAGES };

export function UrlPromptStep() {
  const {
    handleScrape,
    handleManualSelect,
    handleCancel,
    isScraping,
    isTier2NoticeVisible,
  } = useCombinedReviewFormContext();
  const [url, setUrl] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    handleScrape(trimmed);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {URL_PROMPT_MESSAGES.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="url"
            value={url}
            onChange={(changeEvent) => setUrl(changeEvent.target.value)}
            placeholder={URL_PROMPT_MESSAGES.placeholder}
            aria-label={URL_PROMPT_MESSAGES.urlInputAriaLabel}
            autoFocus
            disabled={isScraping}
            className="h-11 flex-1 text-base sm:text-sm"
          />
          <Button
            type="submit"
            disabled={isScraping || !url.trim()}
            className="h-11 shrink-0 gap-2 px-6 font-medium"
          >
            {isScraping ? (
              <Spinner className="size-4" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {URL_PROMPT_MESSAGES.scrapeButton}
          </Button>
        </div>

        <ScrapeDelayNotice
          isVisible={isScraping && isTier2NoticeVisible}
          className="justify-center pt-1"
        />
      </form>

      <div className="space-y-2 border-t pt-6 text-center">
        <span className="block text-sm font-medium text-foreground">
          {URL_PROMPT_MESSAGES.noLinkQuestion}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={handleManualSelect}
          disabled={isScraping}
          className="mx-auto"
        >
          {URL_PROMPT_MESSAGES.manualButton}
        </Button>
        <span className="block text-xs text-muted-foreground">
          {URL_PROMPT_MESSAGES.manualHint}
        </span>
      </div>

      <div className="pt-2 text-center">
        <BackButton
          onClick={handleCancel}
          disabled={isScraping}
          className="text-xs"
        >
          {URL_PROMPT_MESSAGES.backButton}
        </BackButton>
      </div>
    </div>
  );
}
