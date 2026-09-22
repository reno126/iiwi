"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewCreateSchema, type ReviewCreateInput } from "@/schemas/review";
import { reviewCreate } from "@/serverActions/reviewCreate";
import { useAuthGatedSubmit } from "@/lib/auth/useAuthGatedSubmit";
import {
  saveReviewDraft,
  getReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";
import type { Product } from "@/prisma/generated/client";
import { ReviewFields } from "./ReviewFields";
import { StickyFormActionBar } from "@/components/ui/sticky-form-action-bar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleAlert, CheckCircle2 } from "lucide-react";

export const REVIEW_FORM_MESSAGES = {
  draftRestored: "Twoja opinia została przywrócona po zalogowaniu.",
  cancelButton: "Anuluj",
  submitButton: "Opublikuj opinię",
} as const;

interface ReviewFormProps {
  productId: string;
  product?: Product;
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export function ReviewForm({
  productId,
  product,
  onSuccess,
  onCancel,
  className,
  autoFocus = false,
}: ReviewFormProps) {
  const [draft] = useState(() => {
    const savedDraft = getReviewDraft();
    return savedDraft?.type === "REVIEW_EXISTING_PRODUCT" &&
      savedDraft.productId === productId
      ? savedDraft
      : null;
  });

  const [isDraftRestored] = useState(() => Boolean(draft));

  const methods = useForm<ReviewCreateInput>({
    resolver: zodResolver(reviewCreateSchema),
    mode: "onTouched",
    defaultValues: draft?.formData ?? {
      productId,
      description: "",
    },
  });

  const {
    handleSubmit,
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isSubmitting },
  } = methods;

  useEffect(() => {
    function focusDescriptionFieldIfRequested() {
      if (autoFocus) {
        setFocus("description");
      }
    }

    focusDescriptionFieldIfRequested();
  }, [autoFocus, setFocus]);

  const saveCurrentDraft = (data: ReviewCreateInput) => {
    saveReviewDraft({
      type: "REVIEW_EXISTING_PRODUCT",
      returnUrl:
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : productId
            ? `/produkty/${productId}`
            : "/opinie/dodaj",
      productId,
      product,
      formData: data,
    });
  };

  const { handleSubmitAction } = useAuthGatedSubmit({
    setError,
    clearErrors,
    onSaveDraft: saveCurrentDraft,
    action: reviewCreate,
    onSuccess: (data) => onSuccess?.(data.productId),
  });

  const handleCancel = () => {
    clearReviewDraft();
    onCancel?.();
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(handleSubmitAction)}
        className={className ?? "space-y-4"}
      >
        {isDraftRestored && (
          <Alert variant="info">
            <CheckCircle2 className="size-4" />
            <AlertDescription>
              {REVIEW_FORM_MESSAGES.draftRestored}
            </AlertDescription>
          </Alert>
        )}

        {errors.root?.message && (
          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

        <ReviewFields />

        <StickyFormActionBar
          onCancel={onCancel ? handleCancel : undefined}
          cancelLabel={REVIEW_FORM_MESSAGES.cancelButton}
          submitLabel={REVIEW_FORM_MESSAGES.submitButton}
          isSubmitting={isSubmitting}
        />
      </form>
    </FormProvider>
  );
}
