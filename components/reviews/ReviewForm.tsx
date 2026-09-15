"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewCreateSchema, type ReviewCreateInput } from "@/schemas/review";
import { reviewCreate } from "@/serverActions/reviewCreate";
import { UNAUTHORIZED_ERROR_MESSAGE } from "@/lib/constants/authErrors";
import { useEnsureAuthenticated } from "@/lib/auth/useEnsureAuthenticated";
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
  const { ensureAuthenticated } = useEnsureAuthenticated();

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

  const handleCancel = () => {
    clearReviewDraft();
    onCancel?.();
  };

  const onSubmit = async (data: ReviewCreateInput) => {
    clearErrors("root");

    const isAuthenticated = await ensureAuthenticated({
      onUnauthenticated: () => {
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
      },
    });

    if (!isAuthenticated) {
      return;
    }

    const res = await reviewCreate(data);

    if (res?.serverError === UNAUTHORIZED_ERROR_MESSAGE) {
      const isStillAuth = await ensureAuthenticated({
        onUnauthenticated: () => {
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
        },
      });
      if (!isStillAuth) return;

      const retryRes = await reviewCreate(data);
      if (retryRes?.data) {
        clearReviewDraft();
        onSuccess?.(productId);
        return;
      }
      if (retryRes?.serverError) {
        setError("root", { message: retryRes.serverError });
        return;
      }
    }

    if (res?.serverError) {
      setError("root", { message: res.serverError });
      return;
    }

    if (res?.validationErrors) {
      const { fieldErrors, formErrors } = res.validationErrors;
      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof ReviewCreateInput, {
              message: messages[0],
            });
          }
        }
      }
      if (formErrors?.[0]) {
        setError("root", { message: formErrors[0] });
      }
      return;
    }

    if (res?.data) {
      clearReviewDraft();
      onSuccess?.(productId);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className={className}>
        {isDraftRestored && (
          <Alert variant="info" className="mb-4">
            <CheckCircle2 className="size-4" />
            <AlertDescription>
              Twoja opinia została przywrócona po zalogowaniu.
            </AlertDescription>
          </Alert>
        )}

        {errors.root?.message && (
          <Alert variant="destructive" className="mb-4">
            <CircleAlert className="size-4" />
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

        <ReviewFields autoFocusDescription={autoFocus} />

        <div className="flex items-center justify-end gap-2 sm:gap-3 mt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-1/3 sm:w-auto h-11 sm:h-9"
            >
              Anuluj
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial h-11 sm:h-9 font-semibold"
          >
            {isSubmitting && <Spinner className="mr-2 size-4" />}
            Opublikuj opinię
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

