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
import { UNAUTHORIZED_ERROR_MESSAGE } from "@/lib/constants/authErrors";
import { useEnsureAuthenticated } from "@/lib/auth/useEnsureAuthenticated";
import {
  saveReviewDraft,
  getReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";
import { ProductFields } from "./ProductFields";
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
import { CircleAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { StickyFormActionBar } from "./StickyFormActionBar";
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
  const { ensureAuthenticated } = useEnsureAuthenticated();

  const [draft] = useState(() => {
    const d = getReviewDraft();
    return d?.type === "NEW_PRODUCT_AND_REVIEW" ? d : null;
  });

  const [phase, setPhase] = useState<FormPhase>(() => {
    if (draft) {
      return {
        type: "ACTIVE_FORM",
        mode: draft.phase?.mode ?? "manual",
        scrapedFields: draft.phase?.scrapedFields,
        scrapeError: draft.phase?.scrapeError,
      };
    }
    return { type: "URL_PROMPT" };
  });

  const [isScraping, startScrapingTransition] = useTransition();
  const [isTier2NoticeVisible, setIsTier2NoticeVisible] = useState(false);
  const [detectedShop, setDetectedShop] = useState<MatchedShopResult | null>(
    () => draft?.detectedShop ?? null
  );
  const [isDraftRestored] = useState(() => Boolean(draft));

  const methods = useForm<ProductWithReviewCreateInput>({
    resolver: zodResolver(productWithReviewCreateSchema),
    mode: "onChange",
    defaultValues: draft?.formData ?? {
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

  const handleCancel = () => {
    clearReviewDraft();
    onCancel();
  };

  const handleScrape = (inputUrl: string) => {
    let url = inputUrl.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

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
    setValue("productUrl", "", { shouldValidate: false, shouldDirty: false });
    setPhase({
      type: "ACTIVE_FORM",
      mode: "manual",
    });
  };

  const saveCurrentFormDraft = (formData: ProductWithReviewCreateInput) => {
    saveReviewDraft({
      type: "NEW_PRODUCT_AND_REVIEW",
      returnUrl:
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/opinie/dodaj",
      formData,
      phase:
        phase.type === "ACTIVE_FORM"
          ? {
              mode: phase.mode,
              scrapedFields: phase.scrapedFields,
              scrapeError: phase.scrapeError,
            }
          : undefined,
      detectedShop,
    });
  };

  const onSubmit = async (data: ProductWithReviewCreateInput) => {
    clearErrors("root");

    const isAuthenticated = await ensureAuthenticated({
      onUnauthenticated: () => saveCurrentFormDraft(data),
    });

    if (!isAuthenticated) {
      return;
    }

    const res = await productWithReviewCreate(data);

    if (res?.serverError === UNAUTHORIZED_ERROR_MESSAGE) {
      const isStillAuth = await ensureAuthenticated({
        onUnauthenticated: () => saveCurrentFormDraft(data),
      });
      if (!isStillAuth) return;

      const retryRes = await productWithReviewCreate(data);
      if (retryRes?.data) {
        clearReviewDraft();
        onSuccess(retryRes.data.product.id);
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
      clearReviewDraft();
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
            onCancel={handleCancel}
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
              {isDraftRestored && (
                <Alert variant="info">
                  <CheckCircle2 className="size-4" />
                  <AlertDescription>
                    Twoje dane zostały przywrócone po zalogowaniu. Sprawdź je i dodaj opinię.
                  </AlertDescription>
                </Alert>
              )}

              {errors.root?.message && (
                <Alert variant="destructive">
                  <CircleAlert className="size-4" />
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}

              {phase.mode !== "manual" && (
                <ScrapeNoticeBanner
                  mode={phase.mode}
                  scrapedFields={phase.scrapedFields}
                  errorMessage={phase.scrapeError}
                />
              )}

              <ProductFields
                hideProductUrl={
                  phase.mode === "manual" || phase.mode === "scraped_success"
                }
                initialShop={detectedShop}
                legend=""
                showFieldStatus={phase.mode !== "manual"}
              />

              <Separator className="my-2" />

              <ReviewFields />

              <StickyFormActionBar
                onBack={() => {
                  clearReviewDraft();
                  setPhase({ type: "URL_PROMPT" });
                }}
                backLabel="Zmień sposób wprowadzania"
                onCancel={handleCancel}
                cancelLabel="Anuluj"
                submitLabel="Dodaj produkt i opinię"
                isSubmitting={isSubmitting}
              />
            </form>
          </FormProvider>
        )}
      </CardContent>
    </Card>
  );
}
