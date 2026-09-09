"use client";

import { useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productWithReviewCreateSchema,
  type ProductWithReviewCreateInput,
} from "@/schemas/productWithReview";
import { productWithReviewCreate } from "@/serverActions/productWithReviewCreate";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
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
import { CircleAlert, ArrowLeft } from "lucide-react";
import { UrlPromptStep } from "./UrlPromptStep";
import { ScrapeNoticeBanner, type ScrapedFieldType } from "./ScrapeNoticeBanner";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";

interface CombinedProductReviewFormProps {
  onCancel: () => void;
  onSuccess: (productId: string) => void;
}

type FormPhase =
  | { type: "URL_PROMPT" }
  | {
      type: "ACTIVE_FORM";
      mode: "scraped_success" | "scraped_failed" | "manual";
      scrapedFields?: ScrapedFieldType[];
      scrapeError?: string | null;
    };

export function CombinedProductReviewForm({
  onCancel,
  onSuccess,
}: CombinedProductReviewFormProps) {
  const [phase, setPhase] = useState<FormPhase>({ type: "URL_PROMPT" });
  const [isScraping, startScrapingTransition] = useTransition();
  const [isTier2NoticeVisible, setIsTier2NoticeVisible] = useState(false);
  const [detectedShop, setDetectedShop] = useState<MatchedShopResult | null>(null);

  const methods = useForm<ProductWithReviewCreateInput>({
    resolver: zodResolver(productWithReviewCreateSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      productUrl: "",
      imageUrl: "",
      code: "",
      shopId: "",
      description: "",
    },
  });

  const {
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = methods;

  const handleScrape = (inputUrl: string) => {
    let url = inputUrl.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    // Wstępnie zapisujemy productUrl w formularzu
    setValue("productUrl", url, { shouldValidate: true, shouldDirty: true });

    setIsTier2NoticeVisible(false);
    const timer = setTimeout(() => {
      setIsTier2NoticeVisible(true);
    }, 2500);

    startScrapingTransition(async () => {
      try {
        const res = await productScrapeMetadata({ productUrl: url });

        if (res?.data) {
          const { imageUrl, name, code, shop, scrapedFields } = res.data;

          if (imageUrl) {
            setValue("imageUrl", imageUrl, { shouldValidate: true, shouldDirty: true });
          }
          if (name) {
            setValue("name", name, { shouldValidate: true, shouldDirty: true });
          }
          if (code) {
            setValue("code", code, { shouldValidate: true, shouldDirty: true });
          }
          if (shop) {
            setValue("shopId", shop.id, { shouldValidate: true, shouldDirty: true });
            setDetectedShop(shop);
          }

          setPhase({
            type: "ACTIVE_FORM",
            mode: "scraped_success",
            scrapedFields,
          });
          return;
        }

        // Błąd ze strony serwera lub walidacji
        const errorMsg =
          res?.serverError ||
          res?.validationErrors?.fieldErrors?.productUrl?.[0] ||
          res?.validationErrors?.formErrors?.[0] ||
          "Nie udało się automatycznie pobrać danych z podanego linku.";

        setPhase({
          type: "ACTIVE_FORM",
          mode: "scraped_failed",
          scrapeError: errorMsg,
        });
      } catch (err) {
        setPhase({
          type: "ACTIVE_FORM",
          mode: "scraped_failed",
          scrapeError:
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

  const handleManualSelect = () => {
    // Ścieżka 2: Użytkownik nie ma linku - czyścimy pole productUrl
    setValue("productUrl", "", { shouldValidate: false, shouldDirty: false });
    setPhase({
      type: "ACTIVE_FORM",
      mode: "manual",
    });
  };

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
          {phase.type === "URL_PROMPT"
            ? "Rozpocznij od podania linku do oferty lub dodaj produkt ręcznie."
            : phase.mode === "manual"
            ? "Wprowadź nazwę produktu i podziel się swoją recenzją."
            : "Zweryfikuj pobrane dane produktu i podziel się swoją recenzją."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {phase.type === "URL_PROMPT" ? (
          /* STAN 1: Ekran początkowy (3 elementy + opcja manualna) */
          <UrlPromptStep
            onScrape={handleScrape}
            onManualSelect={handleManualSelect}
            onCancel={onCancel}
            isPending={isScraping}
            isTier2NoticeVisible={isTier2NoticeVisible}
          />
        ) : (
          /* STAN 2: Aktywny formularz (ścieżka automatyczna lub manualna) */
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {errors.root?.message && (
                <Alert variant="destructive">
                  <CircleAlert className="size-4" />
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}

              {/* Baner informacyjny o wyniku scrapowania */}
              {phase.mode !== "manual" && (
                <ScrapeNoticeBanner
                  mode={phase.mode}
                  scrapedFields={phase.scrapedFields}
                  errorMessage={phase.scrapeError}
                />
              )}

              {/* Informacja w ścieżce ręcznej */}
              {phase.mode === "manual" && (
                <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground flex items-center justify-between gap-2">
                  <span>
                    Tryb ręczny: <strong>wymagamy tylko nazwy produktu</strong> oraz Twojej oceny.
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhase({ type: "URL_PROMPT" })}
                    className="h-7 text-xs"
                  >
                    Chcę jednak podać link
                  </Button>
                </div>
              )}

              {/* Sub-form 1: Produkt */}
              <ProductFields
                hideProductUrl={phase.mode === "manual" || phase.mode === "scraped_success"}
                initialShop={detectedShop}
              />

              <Separator />

              {/* Sub-form 2: Recenzja */}
              <ReviewFields />

              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPhase({ type: "URL_PROMPT" })}
                  disabled={isSubmitting}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  Zmień sposób wprowadzania
                </Button>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Spinner className="mr-2 size-4" />}
                    Dodaj produkt i opinię
                  </Button>
                </div>
              </div>
            </form>
          </FormProvider>
        )}
      </CardContent>
    </Card>
  );
}
