"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/prisma/generated/client";
import { AsyncSearch } from "./AsyncSearch";
import { productSearch } from "@/serverActions/productSearch";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import {
  getReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectedProductCard } from "./SelectedProductCard";
import { CombinedProductReviewForm as StaticCombinedProductReviewForm } from "./CombinedProductReviewForm";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const LazyCombinedProductReviewForm = lazy(() =>
  import("./CombinedProductReviewForm").then((mod) => ({
    default: mod.CombinedProductReviewForm,
  })),
);

const CombinedProductReviewForm =
  process.env.NODE_ENV === "test"
    ? StaticCombinedProductReviewForm
    : LazyCombinedProductReviewForm;

export const ADD_REVIEW_FLOW_MESSAGES = {
  searchingDescription:
    "Wybierz produkt z bazy lub dodaj nowy, aby podzielić się swoją opinią.",
  addNewProductButton: "Dodaj nowy produkt",
  searchPlaceholder: "Wpisz nazwę lub kod produktu (min. 3 znaki)...",
  emptySearchDescription: "Nie znaleziono takiego produktu w bazie.",
  emptySearchAddReviewButton: "Dodaj recenzję dla nowego produktu",
  formHeading: "Napisz swoją opinię",
} as const;

export type FlowMode =
  | { type: "SEARCHING" }
  | { type: "REVIEW_EXISTING_PRODUCT"; product: Product }
  | { type: "NEW_PRODUCT_AND_REVIEW" };

export function AddReviewFlow() {
  const router = useRouter();
  const [mode, setMode] = useState<FlowMode>(() => {
    const draft = getReviewDraft();
    if (draft?.type === "NEW_PRODUCT_AND_REVIEW") {
      return { type: "NEW_PRODUCT_AND_REVIEW" };
    }
    if (draft?.type === "REVIEW_EXISTING_PRODUCT" && draft.product) {
      return { type: "REVIEW_EXISTING_PRODUCT", product: draft.product };
    }
    return { type: "SEARCHING" };
  });

  const handleSuccess = (productId: string) => {
    clearReviewDraft();
    router.push(`/produkty/${productId}`);
  };

  return (
    <div className="space-y-6">
      {mode.type === "SEARCHING" && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {ADD_REVIEW_FLOW_MESSAGES.searchingDescription}
            </p>
            <Button
              type="button"
              onClick={() => setMode({ type: "NEW_PRODUCT_AND_REVIEW" })}
              className="shrink-0 gap-1.5 w-full md:w-auto"
            >
              <PlusCircle className="size-4" />
              {ADD_REVIEW_FLOW_MESSAGES.addNewProductButton}
            </Button>
          </div>

          <AsyncSearch<Product>
            autoFocus={true}
            searchAction={productSearch}
            placeholder={ADD_REVIEW_FLOW_MESSAGES.searchPlaceholder}
            getItemLabel={(p) => p.name}
            onResultSelect={(product) =>
              setMode({ type: "REVIEW_EXISTING_PRODUCT", product })
            }
            emptyState={
              <div className="p-6 border border-dashed rounded-lg text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  {ADD_REVIEW_FLOW_MESSAGES.emptySearchDescription}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode({ type: "NEW_PRODUCT_AND_REVIEW" })}
                >
                  <PlusCircle className="size-4 mr-2" />
                  {ADD_REVIEW_FLOW_MESSAGES.emptySearchAddReviewButton}
                </Button>
              </div>
            }
          />
        </div>
      )}

      {mode.type === "REVIEW_EXISTING_PRODUCT" && (
        <div className="space-y-6">
          <SelectedProductCard
            product={mode.product}
            onReselect={() => {
              clearReviewDraft();
              setMode({ type: "SEARCHING" });
            }}
          />

          <div className="p-6 border rounded-lg bg-card shadow-xs">
            <h2 className="text-lg font-semibold mb-4">
              {ADD_REVIEW_FLOW_MESSAGES.formHeading}
            </h2>
            <ReviewForm
              productId={mode.product.id}
              product={mode.product}
              onSuccess={handleSuccess}
              onCancel={() => {
                clearReviewDraft();
                setMode({ type: "SEARCHING" });
              }}
            />
          </div>
        </div>
      )}

      {mode.type === "NEW_PRODUCT_AND_REVIEW" && (
        <Suspense
          fallback={
            <div className="space-y-4 p-6 border rounded-xl bg-card">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          }
        >
          <CombinedProductReviewForm
            onCancel={() => {
              clearReviewDraft();
              setMode({ type: "SEARCHING" });
            }}
            onSuccess={handleSuccess}
          />
        </Suspense>
      )}
    </div>
  );
}
