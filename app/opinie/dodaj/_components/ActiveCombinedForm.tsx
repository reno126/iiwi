"use client";

import { useFormContext } from "react-hook-form";
import { ProductFields } from "./ProductFields";
import { ReviewFields } from "@/components/reviews/ReviewFields";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleAlert, CheckCircle2 } from "lucide-react";
import { StickyFormActionBar } from "@/components/ui/sticky-form-action-bar";
import {
  ScrapeNoticeBanner,
  type ScrapedFieldType,
} from "./ScrapeNoticeBanner";
import type { ProductWithReviewCreateInput } from "@/schemas/productWithReview";
import { COMBINED_FORM_MESSAGES } from "./CombinedProductReviewForm";
import { useCombinedReviewFormContext } from "./CombinedReviewFormContext";

export type ActiveFormPhase = {
  type: "ACTIVE_FORM";
  mode: "scraped_success" | "scraped_failed" | "manual";
  scrapedFields?: ScrapedFieldType[];
  scrapeError?: string | null;
};

export function ActiveCombinedForm() {
  const {
    phase,
    detectedShop,
    isDraftRestored,
    onSubmit,
    handleBackToPrompt,
    handleCancel,
  } = useCombinedReviewFormContext();

  const {
    formState: { errors, isSubmitting },
  } = useFormContext<ProductWithReviewCreateInput>();

  const isManualMode = phase.type === "ACTIVE_FORM" && phase.mode === "manual";
  const isScrapedSuccess =
    phase.type === "ACTIVE_FORM" && phase.mode === "scraped_success";

  return (
    <form onSubmit={onSubmit} className="space-y-4 pb-0 md:space-y-6">
      {isDraftRestored && (
        <Alert variant="info">
          <CheckCircle2 className="size-4" />
          <AlertDescription>
            {COMBINED_FORM_MESSAGES.draftRestored}
          </AlertDescription>
        </Alert>
      )}

      {errors.root?.message && (
        <Alert variant="destructive">
          <CircleAlert className="size-4" />
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {phase.type === "ACTIVE_FORM" && phase.mode !== "manual" && (
        <ScrapeNoticeBanner
          mode={phase.mode}
          scrapedFields={phase.scrapedFields}
          errorMessage={phase.scrapeError}
        />
      )}

      <ProductFields
        hideProductUrl={isManualMode || isScrapedSuccess}
        initialShop={detectedShop}
        legend=""
        showFieldStatus={!isManualMode}
      />

      <Separator className="my-2" />

      <ReviewFields />

      <StickyFormActionBar
        onBack={handleBackToPrompt}
        backLabel={COMBINED_FORM_MESSAGES.backLabel}
        onCancel={handleCancel}
        cancelLabel={COMBINED_FORM_MESSAGES.cancelLabel}
        submitLabel={COMBINED_FORM_MESSAGES.submitLabel}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
