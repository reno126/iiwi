"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productWithReviewCreateSchema,
  type ProductWithReviewCreateInput,
} from "@/schemas/productWithReview";
import { productWithReviewCreate } from "@/serverActions/productWithReviewCreate";
import { ProductFields } from "@/components/products/ProductFields";
import { ReviewFields } from "@/components/reviews/ReviewFields";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleAlert } from "lucide-react";

interface CombinedProductReviewFormProps {
  onCancel: () => void;
  onSuccess: (productId: string) => void;
}

export function CombinedProductReviewForm({
  onCancel,
  onSuccess,
}: CombinedProductReviewFormProps) {
  const methods = useForm<ProductWithReviewCreateInput>({
    resolver: zodResolver(productWithReviewCreateSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      productUrl: "",
      imageUrl: "",
      code: "",
      description: "",
    },
  });

  const {
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (data: ProductWithReviewCreateInput) => {
    clearErrors("root");
    const res = await productWithReviewCreate(data);

    if (res?.serverError) {
      setError("root", { message: res.serverError });
      return;
    }

    if (res?.validationErrors) {
      const { fieldErrors, formErrors } = res.validationErrors;
      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof ProductWithReviewCreateInput, {
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
      onSuccess(res.data.product.id);
    }
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader>
        <CardTitle className="text-xl">Dodaj nowy produkt i opinię</CardTitle>
        <CardDescription>
          Podaj dane produktu, a w drugiej części formularza napisz swoją recenzję.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errors.root?.message && (
              <Alert variant="destructive">
                <CircleAlert className="size-4" />
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}

            {/* Sub-form 1: Produkt */}
            <ProductFields />

            <Separator />

            {/* Sub-form 2: Recenzja */}
            <ReviewFields />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Wróć do wyszukiwania
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner className="mr-2 size-4" />}
                Dodaj produkt i opinię
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
