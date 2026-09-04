"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewCreateSchema, type ReviewCreateInput } from "@/schemas/review";
import { reviewCreate } from "@/serverActions/reviewCreate";
import { ReviewFields } from "./ReviewFields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleAlert } from "lucide-react";

interface ReviewFormProps {
  productId: string;
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({
  productId,
  onSuccess,
  onCancel,
  className,
}: ReviewFormProps) {
  const methods = useForm<ReviewCreateInput>({
    resolver: zodResolver(reviewCreateSchema),
    mode: "onTouched",
    defaultValues: {
      productId,
      description: "",
    },
  });

  const {
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (data: ReviewCreateInput) => {
    clearErrors("root");
    const res = await reviewCreate(data);

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
      onSuccess?.(productId);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className={className}>
        {errors.root?.message && (
          <Alert variant="destructive" className="mb-4">
            <CircleAlert className="size-4" />
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

        <ReviewFields />

        <div className="flex items-center justify-end gap-3 mt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2 size-4" />}
            Opublikuj opinię
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
