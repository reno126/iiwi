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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ScrapeDelayNotice } from "@/components/products/ScrapeDelayNotice";
import { Sparkles, Trash2, ImageOff, CircleAlert, CheckCircle2, Check } from "lucide-react";
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
  hideProductUrl?: boolean;
  showFieldStatus?: boolean;
}

export function ProductFields({
  className,
  legend = "Informacje o produkcie",
  initialShop = null,
  hideProductUrl = false,
  showFieldStatus = false,
}: ProductFieldsProps) {
  const {
    register,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useFormContext<ProductCreateInput>();

  const [selectedShop, setSelectedShop] = useState<MatchedShopResult | null>(initialShop);
  const [prevInitialShop, setPrevInitialShop] = useState<MatchedShopResult | null>(initialShop);

  if (prevInitialShop !== initialShop) {
    setPrevInitialShop(initialShop);
    setSelectedShop(initialShop);
  }

  const [isPending, startTransition] = useTransition();
  const [hasScrapedLocally, setHasScrapedLocally] = useState(false);
  const [isTier2NoticeVisible, setIsTier2NoticeVisible] = useState(false);
  const [scrapeNotice, setScrapeNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  const isStatusActive = Boolean(showFieldStatus || hasScrapedLocally);

  const productUrlValue = watch("productUrl");
  const imageUrlValue = watch("imageUrl");
  const nameValue = watch("name");
  const codeValue = watch("code");

  const isNameFilled = Boolean(nameValue && nameValue.trim().length > 0);
  const isImageFilled = Boolean(imageUrlValue && imageUrlValue.trim().length > 0);
  const isCodeFilled = Boolean(codeValue && codeValue.trim().length > 0);

  const [showPreviewOnly, setShowPreviewOnly] = useState<boolean>(() => Boolean(imageUrlValue?.trim()));
  const [prevImageUrlValue, setPrevImageUrlValue] = useState(imageUrlValue);

  if (prevImageUrlValue !== imageUrlValue) {
    setPrevImageUrlValue(imageUrlValue);
    if (imageUrlValue && !prevImageUrlValue) {
      setShowPreviewOnly(true);
    }
  }

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
            setShowPreviewOnly(true);
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

          setScrapeNotice({
            type: "success",
            message: imageUrl
              ? "Pomyślnie zaktualizowano dane i zdjęcie produktu z linku."
              : "Pomyślnie pobrano dane produktu z linku (brak zdjęcia w ofercie).",
          });
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
        setHasScrapedLocally(true);
      }
    });
  };

  const handleClearImage = () => {
    setValue("imageUrl", "", { shouldValidate: true, shouldDirty: true });
    setImageLoadError(false);
    setShowPreviewOnly(false);
  };

  return (
    <FieldSet className={className}>
      {legend && <FieldLegend>{legend}</FieldLegend>}
      <FieldGroup className="gap-3 sm:gap-4">
        <Field
          className={cn(
            "rounded-xl p-3.5 sm:p-4 shadow-2xs transition-all",
            isStatusActive && isNameFilled
              ? "border-2 border-emerald-500 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20"
              : isStatusActive
                ? "border-2 border-gray-300 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/30"
                : "border border-border/80 bg-white focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"
          )}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <FieldLabel
              htmlFor="product-name"
              className={cn(
                "text-sm font-medium",
                isStatusActive && isNameFilled
                  ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold shadow-xs"
                  : isStatusActive
                    ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-600 text-white font-semibold shadow-xs"
                    : "text-foreground"
              )}
            >
              {isStatusActive && (
                isNameFilled ? (
                  <Check className="size-3.5 sm:size-4 stroke-[2.5]" />
                ) : (
                  <CircleAlert className="size-3.5 sm:size-4" />
                )
              )}
              <span>Nazwa produktu *</span>
            </FieldLabel>

            {isStatusActive && (
              <Badge
                variant={isNameFilled ? "success" : "neutral"}
                className="shrink-0 text-xs"
              >
                {isNameFilled ? "Uzupełnione" : "Do uzupełnienia"}
              </Badge>
            )}
          </div>
          <Textarea
            id="product-name"
            rows={1}
            placeholder="np. Logitech MX Master 3S"
            className="min-h-11 py-2.5 text-base sm:text-sm resize-none overflow-hidden bg-white dark:bg-card"
            {...register("name")}
          />
          {errors.name?.message && (
            <FieldError>{errors.name.message}</FieldError>
          )}
        </Field>

        {!hideProductUrl ? (
          <Field className="rounded-xl border border-border/80 bg-white p-3.5 sm:p-4 shadow-2xs transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
            <FieldLabel htmlFor="product-url" className="text-sm font-medium text-foreground">
              Adres URL do produktu
            </FieldLabel>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="product-url"
                type="url"
                inputMode="url"
                placeholder="https://example.com/produkt"
                className="h-11 text-base sm:text-sm flex-1"
                {...register("productUrl", {
                  onBlur: handleUrlBlur,
                })}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleScrape}
                disabled={isPending || !productUrlValue?.trim()}
                className="h-11 sm:h-11 shrink-0 font-medium"
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
            <ScrapeDelayNotice
              isVisible={isPending && isTier2NoticeVisible}
              className="mt-2"
            />

            {/* Nieblokujący komunikat o wyniku scrapowania */}
            {scrapeNotice && (
              <Alert
                variant={scrapeNotice.type === "error" ? "destructive" : "success"}
                className="mt-2 text-xs py-2 px-3"
              >
                {scrapeNotice.type === "error" ? (
                  <CircleAlert className="size-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="size-4 shrink-0" />
                )}
                <AlertDescription className="text-xs leading-relaxed">
                  {scrapeNotice.message}
                </AlertDescription>
              </Alert>
            )}

            {errors.productUrl?.message && (
              <FieldError>{errors.productUrl.message}</FieldError>
            )}
          </Field>
        ) : (
          <input type="hidden" {...register("productUrl")} />
        )}

        <ProductShopSelector
          selectedShop={selectedShop}
          onSelectShop={setSelectedShop}
          disabled={isPending}
          showFieldStatus={isStatusActive}
        />

        {showPreviewOnly && imageUrlValue ? (
          <Field
            className={cn(
              "rounded-xl p-3.5 sm:p-4 shadow-2xs transition-all",
              isStatusActive && isImageFilled
                ? "border-2 border-emerald-500 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20"
                : isStatusActive
                  ? "border-2 border-gray-300 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/30"
                  : "border border-border/80 bg-white"
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <FieldLabel
                className={cn(
                  "text-sm font-medium",
                  isStatusActive && isImageFilled
                    ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold shadow-xs"
                    : isStatusActive
                      ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-600 text-white font-semibold shadow-xs"
                      : "text-foreground"
                )}
              >
                {isStatusActive && (
                  isImageFilled ? (
                    <Check className="size-3.5 sm:size-4 stroke-[2.5]" />
                  ) : (
                    <CircleAlert className="size-3.5 sm:size-4" />
                  )
                )}
                <span>Zdjęcie produktu</span>
              </FieldLabel>

              {isStatusActive && (
                <span
                  className={cn(
                    "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                    isImageFilled
                      ? "text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-900/40"
                      : "text-gray-600 bg-gray-200/90 dark:text-gray-300 dark:bg-gray-800/60"
                  )}
                >
                  {isImageFilled ? "Uzupełnione" : "Do uzupełnienia"}
                </span>
              )}
            </div>

            <input type="hidden" {...register("imageUrl")} />
            {/* Podgląd miniatury zdjęcia z opcją usunięcia */}
            <div className="flex flex-col sm:flex-row items-center gap-3 rounded-lg border bg-white dark:bg-card p-2.5 shadow-2xs">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-md border bg-background flex items-center justify-center">
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
              <div className="flex flex-1 flex-col gap-1 min-w-0 text-center sm:text-left">
                <span className="text-xs font-medium text-foreground truncate">
                  {imageLoadError
                    ? "Błąd ładowania podglądu zdjęcia"
                    : "Podgląd zdjęcia produktu"}
                </span>
                <span className="hidden sm:inline text-xs text-muted-foreground truncate">
                  {imageUrlValue}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearImage}
                className="sm:w-auto shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/40"
              >
                <Trash2 className="size-3.5 mr-1" />
                Usuń
              </Button>
            </div>
            {errors.imageUrl?.message && (
              <FieldError>{errors.imageUrl.message}</FieldError>
            )}
          </Field>
        ) : (
          <Field
            className={cn(
              "rounded-xl p-3.5 sm:p-4 shadow-2xs transition-all",
              isStatusActive && isImageFilled
                ? "border-2 border-emerald-500 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20"
                : isStatusActive
                  ? "border-2 border-gray-300 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/30"
                  : "border border-border/80 bg-white focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <FieldLabel
                htmlFor="product-image"
                className={cn(
                  "text-sm font-medium",
                  isStatusActive && isImageFilled
                    ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold shadow-xs"
                    : isStatusActive
                      ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-600 text-white font-semibold shadow-xs"
                      : "text-foreground"
                )}
              >
                {isStatusActive && (
                  isImageFilled ? (
                    <Check className="size-3.5 sm:size-4 stroke-[2.5]" />
                  ) : (
                    <CircleAlert className="size-3.5 sm:size-4" />
                  )
                )}
                <span>Adres URL zdjęcia</span>
              </FieldLabel>

              {isStatusActive && (
                <span
                  className={cn(
                    "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                    isImageFilled
                      ? "text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-900/40"
                      : "text-gray-600 bg-gray-200/90 dark:text-gray-300 dark:bg-gray-800/60"
                  )}
                >
                  {isImageFilled ? "Uzupełnione" : "Do uzupełnienia"}
                </span>
              )}
            </div>
            <Input
              id="product-image"
              type="url"
              inputMode="url"
              className="h-11 text-base sm:text-sm bg-white dark:bg-card"
              placeholder="https://example.com/zdjecie.jpg"
              {...register("imageUrl")}
            />
            {errors.imageUrl?.message && (
              <FieldError>{errors.imageUrl.message}</FieldError>
            )}
          </Field>
        )}

        <Field
          className={cn(
            "rounded-xl p-3.5 sm:p-4 shadow-2xs transition-all",
            isStatusActive && isCodeFilled
              ? "border-2 border-emerald-500 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20"
              : isStatusActive
                ? "border-2 border-gray-300 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/30"
                : "border border-border/80 bg-white focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"
          )}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <FieldLabel
              htmlFor="product-code"
              className={cn(
                "text-sm font-medium",
                isStatusActive && isCodeFilled
                  ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold shadow-xs"
                  : isStatusActive
                    ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-600 text-white font-semibold shadow-xs"
                    : "text-foreground"
              )}
            >
              {isStatusActive && (
                isCodeFilled ? (
                  <Check className="size-3.5 sm:size-4 stroke-[2.5]" />
                ) : (
                  <CircleAlert className="size-3.5 sm:size-4" />
                )
              )}
              <span>Kod produktu / EAN</span>
            </FieldLabel>

            {isStatusActive && (
              <span
                className={cn(
                  "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                  isCodeFilled
                    ? "text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-900/40"
                    : "text-gray-600 bg-gray-200/90 dark:text-gray-300 dark:bg-gray-800/60"
                )}
              >
                {isCodeFilled ? "Uzupełnione" : "Do uzupełnienia"}
              </span>
            )}
          </div>
          <Input
            id="product-code"
            inputMode="numeric"
            className="h-11 text-base sm:text-sm bg-white dark:bg-card"
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
