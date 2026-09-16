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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
    const d = getReviewDraft();
    return d?.type === "REVIEW_EXISTING_PRODUCT" && d.productId === productId
      ? d
      : null;
  });

  const [isDraftRestored] = useState(() => Boolean(draft));

  const methods = useForm<ReviewCreateInput>({
    resolver: zodResolver(reviewCreateSchema),
    mode: "onChange",
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

        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {REVIEW_FORM_MESSAGES.cancelButton}
            </Button>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 size-4" />
                {REVIEW_FORM_MESSAGES.submitButton}
              </>
            ) : (
              REVIEW_FORM_MESSAGES.submitButton
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
