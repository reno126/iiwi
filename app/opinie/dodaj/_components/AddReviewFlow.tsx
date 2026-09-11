"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/prisma/generated/client";
import { AsyncSearch } from "@/components/AsyncSearch";
import { productSearch } from "@/serverActions/productSearch";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { SelectedProductCard } from "./SelectedProductCard";
import { CombinedProductReviewForm } from "./CombinedProductReviewForm";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export type FlowMode =
  | { type: "SEARCHING" }
  | { type: "REVIEW_EXISTING_PRODUCT"; product: Product }
  | { type: "NEW_PRODUCT_AND_REVIEW" };

export function AddReviewFlow() {
  const router = useRouter();
  const [mode, setMode] = useState<FlowMode>({ type: "SEARCHING" });

  const handleSuccess = (productId: string) => {
    router.push(`/produkty/${productId}`);
  };

  return (
    <div className="space-y-6">
      {/* STAN 1: SEARCHING */}
      {mode.type === "SEARCHING" && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Wybierz produkt z bazy lub dodaj nowy, aby podzielić się swoją
              opinią.
            </p>
            <Button
              type="button"
              onClick={() => setMode({ type: "NEW_PRODUCT_AND_REVIEW" })}
              className="shrink-0 gap-1.5 w-full md:w-auto"
            >
              <PlusCircle className="size-4" />
              Dodaj nowy produkt
            </Button>
          </div>

          <AsyncSearch<Product>
            autoFocus={true}
            searchAction={productSearch}
            placeholder="Wpisz nazwę lub kod produktu (min. 3 znaki)..."
            getItemLabel={(p) => p.name}
            onResultSelect={(product) =>
              setMode({ type: "REVIEW_EXISTING_PRODUCT", product })
            }
            emptyState={
              <div className="p-6 border border-dashed rounded-lg text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nie znaleziono takiego produktu w bazie.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode({ type: "NEW_PRODUCT_AND_REVIEW" })}
                >
                  <PlusCircle className="size-4 mr-2" />
                  Dodaj recenzję dla nowego produktu
                </Button>
              </div>
            }
          />
        </div>
      )}

      {/* STAN 2: REVIEW_EXISTING_PRODUCT */}
      {mode.type === "REVIEW_EXISTING_PRODUCT" && (
        <div className="space-y-6">
          <SelectedProductCard
            product={mode.product}
            onReselect={() => setMode({ type: "SEARCHING" })}
          />

          <div className="p-6 border rounded-lg bg-card shadow-xs">
            <h2 className="text-lg font-semibold mb-4">Napisz swoją opinię</h2>
            <ReviewForm
              productId={mode.product.id}
              onSuccess={handleSuccess}
              onCancel={() => setMode({ type: "SEARCHING" })}
            />
          </div>
        </div>
      )}

      {/* STAN 3: NEW_PRODUCT_AND_REVIEW */}
      {mode.type === "NEW_PRODUCT_AND_REVIEW" && (
        <CombinedProductReviewForm
          onCancel={() => setMode({ type: "SEARCHING" })}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
