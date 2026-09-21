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
import { CombinedReviewFormProvider } from "./CombinedReviewFormContext";
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
  const form = useCombinedReviewForm({ onCancel, onSuccess });

  return (
    <CombinedReviewFormProvider value={form}>
      <Card className="overflow-visible border-none bg-transparent shadow-none ring-0 md:border md:bg-card md:shadow-xs">
        <CardHeader className="px-0 md:px-6">
          <CardTitle className="text-xl">
            {resolveCardTitle(form.phase)}
          </CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>

        <CardContent className="px-0 md:px-6">
          {form.phase.type === "URL_PROMPT" ? (
            <UrlPromptStep />
          ) : (
            <FormProvider {...form.methods}>
              <ActiveCombinedForm />
            </FormProvider>
          )}
        </CardContent>
      </Card>
    </CombinedReviewFormProvider>
  );
}
