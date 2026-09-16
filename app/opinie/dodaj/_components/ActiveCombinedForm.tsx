"use client";

import { useFormContext } from "react-hook-form";
import { ProductFields } from "./ProductFields";
import { ReviewFields } from "@/components/reviews/ReviewFields";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleAlert, CheckCircle2 } from "lucide-react";
import { StickyFormActionBar } from "./StickyFormActionBar";
import {
  ScrapeNoticeBanner,
  type ScrapedFieldType,
} from "./ScrapeNoticeBanner";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import type { ProductWithReviewCreateInput } from "@/schemas/productWithReview";
import { COMBINED_FORM_MESSAGES } from "./CombinedProductReviewForm";

export type ActiveFormPhase = {
  type: "ACTIVE_FORM";
  mode: "scraped_success" | "scraped_failed" | "manual";
  scrapedFields?: ScrapedFieldType[];
  scrapeError?: string | null;
};

interface ActiveCombinedFormProps {
  phase: ActiveFormPhase;
  detectedShop: MatchedShopResult | null;
  isDraftRestored: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onBack: () => void;
  onCancel: () => void;
}

export function ActiveCombinedForm({
  phase,
  detectedShop,
  isDraftRestored,
  onSubmit,
  onBack,
  onCancel,
}: ActiveCombinedFormProps) {
  const {
    formState: { errors, isSubmitting },
  } = useFormContext<ProductWithReviewCreateInput>();

  return (
    <form onSubmit={onSubmit} className="space-y-4 md:space-y-6 pb-0">
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

      {phase.mode !== "manual" && (
        <ScrapeNoticeBanner
          mode={phase.mode}
          scrapedFields={phase.scrapedFields}
          errorMessage={phase.scrapeError}
        />
      )}

      <ProductFields
        hideProductUrl={
          phase.mode === "manual" || phase.mode === "scraped_success"
        }
        initialShop={detectedShop}
        legend=""
        showFieldStatus={phase.mode !== "manual"}
      />

      <Separator className="my-2" />

      <ReviewFields />

      <StickyFormActionBar
        onBack={onBack}
        backLabel={COMBINED_FORM_MESSAGES.backLabel}
        onCancel={onCancel}
        cancelLabel={COMBINED_FORM_MESSAGES.cancelLabel}
        submitLabel={COMBINED_FORM_MESSAGES.submitLabel}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
