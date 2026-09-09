"use client";

import { useState, useTransition } from "react";
import { useFormContext } from "react-hook-form";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles, Trash2, ImageOff, CircleAlert, CheckCircle2 } from "lucide-react";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import { shopMatchByUrlAction } from "@/serverActions/shopMatchByUrlAction";
import { ProductShopSelector } from "@/components/products/ProductShopSelector";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import type { ProductCreateInput } from "@/schemas/product";
import { cn } from "cn";

interface ProductFieldsProps {
  className?: string;
  legend?: string;
  initialShop?: MatchedShopResult | null;
}

export function ProductFields({
  className,
  legend = "Informacje o produkcie",
  initialShop = null,
}: ProductFieldsProps) {
  const {
    register,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useFormContext<ProductCreateInput>();

  const [selectedShop, setSelectedShop] = useState<MatchedShopResult | null>(initialShop);
  const [isPending, startTransition] = useTransition();
  const [isTier2NoticeVisible, setIsTier2NoticeVisible] = useState(false);
  const [scrapeNotice, setScrapeNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  const productUrlValue = watch("productUrl");
  const imageUrlValue = watch("imageUrl");

  const handleUrlBlur = async () => {
    const currentShopId = getValues("shopId");
    if (currentShopId) return;

    const rawUrl = (getValues("productUrl") || "").trim();
    if (!rawUrl) return;

    try {
      const res = await shopMatchByUrlAction({ url: rawUrl });
      if (res?.data) {
        setValue("shopId", res.data.id, { shouldValidate: true, shouldDirty: true });
        setSelectedShop(res.data);
      }
    } catch {
      // Ignorujemy błędy cichego dopasowania w tle
    }
  };

  const handleScrape = () => {
    let url = (getValues("productUrl") || "").trim();
    if (!url) return;

    // Automatyczne uzupełnienie brakującego protokołu
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
      setValue("productUrl", url, { shouldValidate: true, shouldDirty: true });
    }

    setScrapeNotice(null);
    setIsTier2NoticeVisible(false);

    const timer = setTimeout(() => {
      setIsTier2NoticeVisible(true);
    }, 2500);

    startTransition(async () => {
      try {
        const res = await productScrapeMetadata({ productUrl: url });

        if (res?.serverError) {
          setScrapeNotice({ type: "error", message: res.serverError });
          return;
        }

        if (res?.validationErrors) {
          const fieldError = res.validationErrors.fieldErrors?.productUrl?.[0];
          const formError = res.validationErrors.formErrors?.[0];
          setScrapeNotice({
            type: "error",
            message: fieldError || formError || "Nieprawidłowy adres URL.",
          });
          return;
        }

        if (res?.data) {
          const { imageUrl, name, code, shop } = res.data;

          if (imageUrl) {
            setValue("imageUrl", imageUrl, { shouldValidate: true, shouldDirty: true });
            setImageLoadError(false);
            setScrapeNotice({
              type: "success",
              message: "Zdjęcie produktu zostało pomyślnie pobrane.",
            });
          }

          // 4b: Pomocnicze uzupełnienie nazwy tylko jeśli pole jest puste
          const currentName = (getValues("name") || "").trim();
          if (!currentName && name) {
            setValue("name", name, { shouldValidate: true, shouldDirty: true });
          }

          // 4c: Pomocnicze uzupełnienie kodu tylko jeśli pole jest puste
          const currentCode = (getValues("code") || "").trim();
          if (!currentCode && code) {
            setValue("code", code, { shouldValidate: true, shouldDirty: true });
          }

          // 4d: Pomocnicze uzupełnienie sklepu jeśli dopasowano i pole jest puste
          if (shop) {
            setValue("shopId", shop.id, { shouldValidate: true, shouldDirty: true });
            setSelectedShop(shop);
          }
        }
      } catch (err: unknown) {
        setScrapeNotice({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Wystąpił nieoczekiwany błąd podczas pobierania danych.",
        });
      } finally {
        clearTimeout(timer);
        setIsTier2NoticeVisible(false);
      }
    });
  };

  const handleClearImage = () => {
    setValue("imageUrl", "", { shouldValidate: true, shouldDirty: true });
    setImageLoadError(false);
  };

  return (
    <FieldSet className={className}>
      <FieldLegend>{legend}</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="product-name">Nazwa produktu *</FieldLabel>
          <Input
            id="product-name"
            placeholder="np. Logitech MX Master 3S"
            {...register("name")}
          />
          {errors.name?.message && (
            <FieldError>{errors.name.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="product-url">Adres URL do produktu</FieldLabel>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="product-url"
              type="url"
              placeholder="https://example.com/produkt"
              {...register("productUrl", {
                onBlur: handleUrlBlur,
              })}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleScrape}
              disabled={isPending || !productUrlValue?.trim()}
              className="shrink-0"
            >
              {isPending ? (
                <Spinner className="mr-2 size-4" />
              ) : (
                <Sparkles className="mr-2 size-4 text-primary" />
              )}
              Wyciągnij zdjęcie produktu
            </Button>
          </div>

          {/* Komunikat o wydłużonym czasie Tier 2 */}
          {isPending && isTier2NoticeVisible && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <Spinner className="size-3.5" />
              <span>Zajmie to chwilę dłużej, ale nadal pracuję nad tym...</span>
            </div>
          )}

          {/* Nieblokujący komunikat o wyniku scrapowania */}
          {scrapeNotice && (
            <div
              className={cn(
                "mt-2 flex items-start gap-2 rounded-md border p-2.5 text-xs",
                scrapeNotice.type === "error"
                  ? "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20"
                  : "border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
              )}
            >
              {scrapeNotice.type === "error" ? (
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              )}
              <span className="flex-1 leading-relaxed">{scrapeNotice.message}</span>
            </div>
          )}

          {errors.productUrl?.message && (
            <FieldError>{errors.productUrl.message}</FieldError>
          )}
        </Field>

        <ProductShopSelector
          selectedShop={selectedShop}
          onSelectShop={setSelectedShop}
          disabled={isPending}
        />

        <Field>
          <FieldLabel htmlFor="product-image">Adres URL zdjęcia</FieldLabel>
          <Input
            id="product-image"
            type="url"
            placeholder="https://example.com/zdjecie.jpg"
            {...register("imageUrl")}
          />
          {errors.imageUrl?.message && (
            <FieldError>{errors.imageUrl.message}</FieldError>
          )}

          {/* Podgląd miniatury zdjęcia z opcją usunięcia */}
          {imageUrlValue && (
            <div className="mt-2.5 flex items-center gap-3 rounded-lg border bg-muted/30 p-2.5">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md border bg-background flex items-center justify-center">
                {imageLoadError ? (
                  <ImageOff className="size-6 text-muted-foreground" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrlValue}
                    alt="Podgląd zdjęcia produktu"
                    className="size-full object-contain"
                    onError={() => setImageLoadError(true)}
                    onLoad={() => setImageLoadError(false)}
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <span className="text-xs font-medium text-foreground truncate">
                  {imageLoadError
                    ? "Błąd ładowania podglądu zdjęcia"
                    : "Podgląd zdjęcia produktu"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {imageUrlValue}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearImage}
                className="shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/40"
              >
                <Trash2 className="size-3.5 mr-1" />
                Usuń
              </Button>
            </div>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="product-code">Kod produktu / EAN</FieldLabel>
          <Input
            id="product-code"
            placeholder="np. 5099206103734"
            {...register("code")}
          />
          {errors.code?.message && (
            <FieldError>{errors.code.message}</FieldError>
          )}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
