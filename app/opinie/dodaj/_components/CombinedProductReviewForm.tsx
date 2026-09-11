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
import {
  ScrapeNoticeBanner,
  type ScrapedFieldType,
} from "./ScrapeNoticeBanner";
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
  const [detectedShop, setDetectedShop] = useState<MatchedShopResult | null>(
    null,
  );

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
            setValue("imageUrl", imageUrl, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
          if (name) {
            setValue("name", name, { shouldValidate: true, shouldDirty: true });
          }
          if (code) {
            setValue("code", code, { shouldValidate: true, shouldDirty: true });
          }
          if (shop) {
            setValue("shopId", shop.id, {
              shouldValidate: true,
              shouldDirty: true,
            });
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
    <Card className="border-none shadow-none ring-0 md:border md:shadow-xs bg-transparent md:bg-card overflow-visible">
      <CardHeader className="px-0 md:px-6">
        <CardTitle className="text-xl">
          {" "}
          {phase.type === "URL_PROMPT"
            ? "Masz link do oferty produktu?"
            : phase.mode === "manual"
              ? "Tryb ręczny"
              : "Zweryfikuj pobrane dane"}
        </CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>

      <CardContent className="px-0 md:px-6">
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
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 md:space-y-6 pb-0"
            >
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPhase({ type: "URL_PROMPT" })}
                  className="h-7 text-xs"
                >
                  Chcę jednak podać link
                </Button>
              )}

              {/* Sub-form 1: Produkt */}
              <ProductFields
                hideProductUrl={
                  phase.mode === "manual" || phase.mode === "scraped_success"
                }
                initialShop={detectedShop}
                legend=""
              />

              <Separator className="my-2" />

              {/* Sub-form 2: Recenzja */}
              <ReviewFields />

              {/* Dolny pasek akcji: przyklejony do dołu ekranu na mobile (< md), statyczny na desktopie (>= md) */}
              <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg md:static md:inset-auto md:z-auto md:border-t-0 md:p-0 md:bg-transparent md:backdrop-blur-none md:shadow-none md:mt-6">
                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 max-w-2xl mx-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setPhase({ type: "URL_PROMPT" })}
                    disabled={isSubmitting}
                    className="gap-1.5 text-muted-foreground hover:text-foreground w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <ArrowLeft className="size-4" />
                    Zmień sposób wprowadzania
                  </Button>

                  <div className="flex items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isSubmitting}
                      className="w-1/3 sm:w-auto h-11 sm:h-9"
                    >
                      Anuluj
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-2/3 sm:w-auto h-11 sm:h-9 font-semibold"
                    >
                      {isSubmitting && <Spinner className="mr-2 size-4" />}
                      Dodaj produkt i opinię
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </FormProvider>
        )}
      </CardContent>
    </Card>
  );
}
