"use client";

import { useState, useCallback, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/prisma/generated/client";
import { AsyncSearch } from "@/components/search/AsyncSearch";
import {
  productSearch,
  type ProductSearchResultItem,
} from "@/serverActions/productSearch";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import {
  getReviewDraft,
  clearReviewDraft,
  type ExistingProductSummary,
} from "@/lib/storage/reviewDraftStorage";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectedProductCard } from "./SelectedProductCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const CombinedProductReviewForm = lazy(() =>
  import("./CombinedProductReviewForm").then((module) => ({
    default: module.CombinedProductReviewForm,
  })),
);

import { ADD_REVIEW_FLOW_MESSAGES } from "./addReviewFlowMessages";

export { ADD_REVIEW_FLOW_MESSAGES };

export type FlowMode =
  | { type: "SEARCHING" }
  | {
      type: "REVIEW_EXISTING_PRODUCT";
      product: ExistingProductSummary | Product;
    }
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

  const handleSuccess = useCallback(
    (productId: string) => {
      clearReviewDraft();
      router.push(`/produkty/${productId}`);
    },
    [router],
  );

  const handleCancelFlow = useCallback(() => {
    clearReviewDraft();
    setMode({ type: "SEARCHING" });
  }, []);

  const handleStartNewProductFlow = useCallback(() => {
    setMode({ type: "NEW_PRODUCT_AND_REVIEW" });
  }, []);

  const handleProductSelect = useCallback(
    (selectedProduct: ProductSearchResultItem) => {
      setMode({ type: "REVIEW_EXISTING_PRODUCT", product: selectedProduct });
    },
    [],
  );

  const getProductItemLabel = useCallback(
    (productItem: ProductSearchResultItem) => productItem.name,
    [],
  );

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
              onClick={handleStartNewProductFlow}
              className="w-full shrink-0 gap-1.5 md:w-auto"
            >
              <PlusCircle className="size-4" />
              {ADD_REVIEW_FLOW_MESSAGES.addNewProductButton}
            </Button>
          </div>

          <AsyncSearch<ProductSearchResultItem>
            autoFocus={true}
            searchAction={productSearch}
            placeholder={ADD_REVIEW_FLOW_MESSAGES.searchPlaceholder}
            getItemLabel={getProductItemLabel}
            onResultSelect={handleProductSelect}
            emptyState={
              <div className="space-y-3 rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {ADD_REVIEW_FLOW_MESSAGES.emptySearchDescription}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartNewProductFlow}
                >
                  <PlusCircle className="mr-2 size-4" />
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
            onReselect={handleCancelFlow}
          />

          <div className="rounded-lg border bg-card p-6 shadow-xs">
            <h2 className="mb-4 text-lg font-semibold">
              {ADD_REVIEW_FLOW_MESSAGES.formHeading}
            </h2>
            <ReviewForm
              productId={mode.product.id}
              product={mode.product}
              onSuccess={handleSuccess}
              onCancel={handleCancelFlow}
            />
          </div>
        </div>
      )}

      {mode.type === "NEW_PRODUCT_AND_REVIEW" && (
        <Suspense
          fallback={
            <div className="space-y-4 rounded-xl border bg-card p-6">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          }
        >
          <CombinedProductReviewForm
            onCancel={handleCancelFlow}
            onSuccess={handleSuccess}
          />
        </Suspense>
      )}
    </div>
  );
}
