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
import { useAuthGatedSubmit } from "@/lib/auth/useAuthGatedSubmit";
import {
  saveReviewDraft,
  getReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UrlPromptStep } from "./UrlPromptStep";
import { ActiveCombinedForm, type ActiveFormPhase } from "./ActiveCombinedForm";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";

export const COMBINED_FORM_MESSAGES = {
  urlPromptTitle: "Masz link do oferty produktu?",
  manualTitle: "Tryb ręczny",
  scrapedTitle: "Zweryfikuj pobrane dane",
  draftRestored:
    "Twoje dane zostały przywrócone po zalogowaniu. Sprawdź je i dodaj opinię.",
  defaultScrapeError:
    "Nie udało się automatycznie pobrać danych z podanego linku.",
  unexpectedScrapeError:
    "Wystąpił nieoczekiwany błąd podczas pobierania danych.",
  backLabel: "Zmień sposób wprowadzania",
  cancelLabel: "Anuluj",
  submitLabel: "Dodaj produkt i opinię",
} as const;

interface CombinedProductReviewFormProps {
  onCancel: () => void;
  onSuccess: (productId: string) => void;
}

type FormPhase = { type: "URL_PROMPT" } | ActiveFormPhase;

export function CombinedProductReviewForm({
  onCancel,
  onSuccess,
}: CombinedProductReviewFormProps) {
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
    () => draft?.detectedShop ?? null,
  );
  const [isDraftRestored] = useState(() => Boolean(draft));

  const methods = useForm<ProductWithReviewCreateInput>({
    resolver: zodResolver(productWithReviewCreateSchema),
    mode: "onTouched",
    defaultValues: draft?.formData ?? {
      name: "",
      productUrl: "",
      imageUrl: "",
      code: "",
      shopId: "",
      description: "",
    },
  });

  const { handleSubmit, setValue, setError, clearErrors } = methods;

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

  const { handleSubmitAction } = useAuthGatedSubmit({
    setError,
    clearErrors,
    onSaveDraft: saveCurrentFormDraft,
    action: productWithReviewCreate,
    onSuccess: (data) => onSuccess(data.product.id),
  });

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
          COMBINED_FORM_MESSAGES.defaultScrapeError;

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
              : COMBINED_FORM_MESSAGES.unexpectedScrapeError,
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

  return (
    <Card className="overflow-visible border-none bg-transparent shadow-none ring-0 md:border md:bg-card md:shadow-xs">
      <CardHeader className="px-0 md:px-6">
        <CardTitle className="text-xl">
          {phase.type === "URL_PROMPT"
            ? COMBINED_FORM_MESSAGES.urlPromptTitle
            : phase.mode === "manual"
              ? COMBINED_FORM_MESSAGES.manualTitle
              : COMBINED_FORM_MESSAGES.scrapedTitle}
        </CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>

      <CardContent className="px-0 md:px-6">
        {phase.type === "URL_PROMPT" ? (
          <UrlPromptStep
            onScrape={handleScrape}
            onManualSelect={handleManualSelect}
            onCancel={handleCancel}
            isPending={isScraping}
            isTier2NoticeVisible={isTier2NoticeVisible}
          />
        ) : (
          <FormProvider {...methods}>
            <ActiveCombinedForm
              phase={phase}
              detectedShop={detectedShop}
              isDraftRestored={isDraftRestored}
              onSubmit={handleSubmit(handleSubmitAction)}
              onBack={() => {
                clearReviewDraft();
                setPhase({ type: "URL_PROMPT" });
              }}
              onCancel={handleCancel}
            />
          </FormProvider>
        )}
      </CardContent>
    </Card>
  );
}
