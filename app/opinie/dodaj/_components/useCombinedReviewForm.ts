import { useState, useCallback, useMemo } from "react";
import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productWithReviewCreateSchema,
  type ProductWithReviewCreateInput,
} from "@/schemas/productWithReview";
import { productWithReviewCreate } from "@/serverActions/productWithReviewCreate";
import { useAuthGatedSubmit } from "@/lib/auth/useAuthGatedSubmit";
import {
  saveReviewDraft,
  getReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import type { ActiveFormPhase } from "./ActiveCombinedForm";
import { useProductScrape } from "@/hooks/useProductScrape";
import { populateScrapedFields } from "./populateScrapedFields";

export type FormPhase = { type: "URL_PROMPT" } | ActiveFormPhase;

const initialDefaultValues: DefaultValues<ProductWithReviewCreateInput> = {
  name: "",
  productUrl: "",
  imageUrl: "",
  code: "",
  shopId: "",
  description: "",
};

function resolveInitialDraft() {
  const draft = getReviewDraft();
  return draft?.type === "NEW_PRODUCT_AND_REVIEW" ? draft : null;
}

function resolveInitialPhase(
  draft: ReturnType<typeof resolveInitialDraft>,
): FormPhase {
  if (draft) {
    return {
      type: "ACTIVE_FORM",
      mode: draft.phase?.mode ?? "manual",
      scrapedFields: draft.phase?.scrapedFields,
      scrapeError: draft.phase?.scrapeError,
    };
  }
  return { type: "URL_PROMPT" };
}

function resolveCurrentPath(): string {
  if (typeof window !== "undefined") {
    return window.location.pathname + window.location.search;
  }
  return "/opinie/dodaj";
}

interface UseCombinedReviewFormProps {
  onCancel: () => void;
  onSuccess: (productId: string) => void;
}

export function useCombinedReviewForm({
  onCancel,
  onSuccess,
}: UseCombinedReviewFormProps) {
  const [draft] = useState(resolveInitialDraft);
  const [phase, setPhase] = useState<FormPhase>(() =>
    resolveInitialPhase(draft),
  );
  const [detectedShop, setDetectedShop] = useState<MatchedShopResult | null>(
    () => draft?.detectedShop ?? null,
  );
  const [isDraftRestored] = useState(() => Boolean(draft));

  const methods = useForm<ProductWithReviewCreateInput>({
    resolver: zodResolver(productWithReviewCreateSchema),
    mode: "onTouched",
    defaultValues: draft?.formData ?? initialDefaultValues,
  });

  const saveCurrentFormDraft = useCallback(
    (formData: ProductWithReviewCreateInput) => {
      saveReviewDraft({
        type: "NEW_PRODUCT_AND_REVIEW",
        returnUrl: resolveCurrentPath(),
        formData,
        phase:
          phase.type === "ACTIVE_FORM"
            ? {
                mode: phase.mode,
                scrapedFields: phase.scrapedFields,
                scrapeError: phase.scrapeError,
              }
            : undefined,
        detectedShop,
      });
    },
    [phase, detectedShop],
  );

  const { handleSubmitAction } = useAuthGatedSubmit({
    setError: methods.setError,
    clearErrors: methods.clearErrors,
    onSaveDraft: saveCurrentFormDraft,
    action: productWithReviewCreate,
    onSuccess: (data) => onSuccess(data.product.id),
  });

  const {
    isPending: isScraping,
    isTier2NoticeVisible,
    scrapeUrl,
  } = useProductScrape();

  const handleScrape = useCallback(
    (inputUrl: string) => {
      const trimmed = inputUrl.trim();
      if (!trimmed) return;

      methods.setValue("productUrl", trimmed, {
        shouldValidate: true,
        shouldDirty: true,
      });

      scrapeUrl(
        trimmed,
        (data) => {
          populateScrapedFields({
            data,
            setValue: methods.setValue,
            overwrite: true,
          });
          if (data.shop) {
            setDetectedShop(data.shop);
          }
          setPhase({
            type: "ACTIVE_FORM",
            mode: "scraped_success",
            scrapedFields: data.scrapedFields,
          });
        },
        (errorMsg) => {
          setPhase({
            type: "ACTIVE_FORM",
            mode: "scraped_failed",
            scrapeError: errorMsg,
          });
        },
      );
    },
    [methods, scrapeUrl],
  );

  const handleManualSelect = useCallback(() => {
    methods.setValue("productUrl", "", {
      shouldValidate: false,
      shouldDirty: false,
    });
    setPhase({
      type: "ACTIVE_FORM",
      mode: "manual",
    });
  }, [methods]);

  const handleBackToPrompt = useCallback(() => {
    clearReviewDraft();
    setPhase({ type: "URL_PROMPT" });
  }, []);

  const handleCancel = useCallback(() => {
    clearReviewDraft();
    onCancel();
  }, [onCancel]);

  const onSubmit = useMemo(
    () => methods.handleSubmit(handleSubmitAction),
    [methods, handleSubmitAction],
  );

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
}

export type UseCombinedReviewFormReturn = ReturnType<
  typeof useCombinedReviewForm
>;
