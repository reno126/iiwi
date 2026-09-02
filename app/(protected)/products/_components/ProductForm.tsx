"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";

import {
  productCreateSchema,
  type ProductCreateInput,
} from "@/schemas/product";
import { productCreate } from "@/serverActions/productCreate";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/shadcn/utils";

interface ProductFormProps {
  defaultValues?: Partial<ProductCreateInput>;
  onSuccess?: (product: unknown) => void;
  className?: string;
}

export function ProductForm({
  defaultValues,
  onSuccess,
  className,
}: ProductFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductCreateInput>({
    resolver: zodResolver(productCreateSchema),
    mode: "onTouched",
    defaultValues: {
      name: defaultValues?.name ?? "",
      productUrl: defaultValues?.productUrl ?? "",
      code: defaultValues?.code ?? "",
    },
  });

  const { execute, isPending, result } = useAction(productCreate, {
    onSuccess: ({ data }) => {
      if (onSuccess) {
        onSuccess(data);
      } else {
        // router.push("/dashboard");
        // router.refresh();
      }
    },
    onError: ({ error: { validationErrors } }) => {
      if (validationErrors?.fieldErrors) {
        for (const [field, messages] of Object.entries(
          validationErrors.fieldErrors,
        )) {
          if (messages?.[0]) {
            setError(field as keyof ProductCreateInput, {
              message: messages[0],
            });
          }
        }
      }

      if (validationErrors?.formErrors?.[0]) {
        setError("root", { message: validationErrors.formErrors[0] });
      }
    },
  });

  const onSubmit = (values: ProductCreateInput) => {
    execute(values);
  };

  const isLoading = isPending || isSubmitting;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Szczegóły produktu</CardTitle>
        <CardDescription>
          Wprowadź wymagane informacje, aby utworzyć produkt. Pola oznaczone
          gwiazdką (*) są wymagane.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {(result.serverError || errors.root?.message) && (
            <Alert variant="destructive">
              <CircleAlert className="size-4" />
              <AlertDescription>
                {result.serverError || errors.root?.message}
              </AlertDescription>
            </Alert>
          )}

          {result.data && (
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
              <CircleCheck className="size-4 text-green-600 dark:text-green-400" />
              <AlertDescription>
                Produkt &quot;{result.data.name}&quot; został pomyślnie utworzony!
                Trwa przekierowywanie...
              </AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            {/* Name */}
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="product-name">
                Nazwa produktu <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="product-name"
                placeholder="np. Bezprzewodowe słuchawki z redukcją szumów"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <div className="flex flex-col gap-0.5">
                <FieldDescription>
                  Od 3 do 100 znaków.
                </FieldDescription>
                <FieldError
                  role={errors.name ? "alert" : undefined}
                  aria-hidden={!errors.name}
                  className={cn(
                    "min-h-5 text-sm font-normal text-destructive leading-tight",
                    !errors.name && "invisible",
                  )}
                >
                  {errors.name?.message || "\u00A0"}
                </FieldError>
              </div>
            </Field>

            {/* Product URL */}
            <Field data-invalid={!!errors.productUrl}>
              <FieldLabel htmlFor="product-url">Adres URL produktu</FieldLabel>
              <Input
                id="product-url"
                type="url"
                placeholder="https://example.com/produkt/item-123"
                aria-invalid={!!errors.productUrl}
                {...register("productUrl")}
              />
              <div className="flex flex-col gap-0.5">
                <FieldDescription>
                  Opcjonalny link do oficjalnej strony produktu lub sklepu.
                </FieldDescription>
                <FieldError
                  role={errors.productUrl ? "alert" : undefined}
                  aria-hidden={!errors.productUrl}
                  className={cn(
                    "min-h-5 text-sm font-normal text-destructive leading-tight",
                    !errors.productUrl && "invisible",
                  )}
                >
                  {errors.productUrl?.message || "\u00A0"}
                </FieldError>
              </div>
            </Field>

            {/* Product Code */}
            <Field data-invalid={!!errors.code}>
              <FieldLabel htmlFor="product-code">Kod produktu / SKU</FieldLabel>
              <Input
                id="product-code"
                placeholder="np. PRD-98124"
                aria-invalid={!!errors.code}
                {...register("code")}
              />
              <div className="flex flex-col gap-0.5">
                <FieldDescription>
                  Opcjonalny kod SKU lub identyfikator (maksymalnie 24 znaki).
                </FieldDescription>
                <FieldError
                  role={errors.code ? "alert" : undefined}
                  aria-hidden={!errors.code}
                  className={cn(
                    "min-h-5 text-sm font-normal text-destructive leading-tight",
                    !errors.code && "invisible",
                  )}
                >
                  {errors.code?.message || "\u00A0"}
                </FieldError>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Anuluj
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Spinner className="mr-2" />}
            {isLoading ? "Tworzenie produktu..." : "Utwórz produkt"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
