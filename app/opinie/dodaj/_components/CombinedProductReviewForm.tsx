"use client";

import { FormProvider } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UrlPromptStep } from "./UrlPromptStep";
import { ActiveCombinedForm } from "./ActiveCombinedForm";
import { useCombinedReviewForm, type FormPhase } from "./useCombinedReviewForm";
import { COMBINED_FORM_MESSAGES } from "./combinedFormMessages";

export { COMBINED_FORM_MESSAGES } from "./combinedFormMessages";

interface CombinedProductReviewFormProps {
  onCancel: () => void;
  onSuccess: (productId: string) => void;
}

function resolveCardTitle(phase: FormPhase): string {
  if (phase.type === "URL_PROMPT") {
    return COMBINED_FORM_MESSAGES.urlPromptTitle;
  }
  if (phase.mode === "manual") {
    return COMBINED_FORM_MESSAGES.manualTitle;
  }
  return COMBINED_FORM_MESSAGES.scrapedTitle;
}

export function CombinedProductReviewForm({
  onCancel,
  onSuccess,
}: CombinedProductReviewFormProps) {
  const {
    methods,
    phase,
    detectedShop,
    isDraftRestored,
    isScraping,
    isTier2NoticeVisible,
    handleScrape,
    handleManualSelect,
    handleBackToPrompt,
    handleCancel,
    onSubmit,
  } = useCombinedReviewForm({ onCancel, onSuccess });

  return (
    <Card className="overflow-visible border-none bg-transparent shadow-none ring-0 md:border md:bg-card md:shadow-xs">
      <CardHeader className="px-0 md:px-6">
        <CardTitle className="text-xl">{resolveCardTitle(phase)}</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>

      <CardContent className="px-0 md:px-6">
        {phase.type === "URL_PROMPT" ? (
          <UrlPromptStep
            onScrape={handleScrape}
            onManualSelect={handleManualSelect}
            onCancel={handleCancel}
            isPending={isScraping}
            isTier2NoticeVisible={isTier2NoticeVisible}
          />
        ) : (
          <FormProvider {...methods}>
            <ActiveCombinedForm
              phase={phase}
              detectedShop={detectedShop}
              isDraftRestored={isDraftRestored}
              onSubmit={onSubmit}
              onBack={handleBackToPrompt}
              onCancel={handleCancel}
            />
          </FormProvider>
        )}
      </CardContent>
    </Card>
  );
}
