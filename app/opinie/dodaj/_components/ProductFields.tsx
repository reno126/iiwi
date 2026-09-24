"use client";

import { useState, useTransition } from "react";
import { FieldSet, FieldLegend, FieldGroup } from "@/components/ui/field";
import { ProductNameField } from "./fields/ProductNameField";
import { ProductUrlField } from "./fields/ProductUrlField";
import { ProductImageField } from "./fields/ProductImageField";
import { ProductCodeField } from "./fields/ProductCodeField";
import { ProductShopSelector } from "./ProductShopSelector";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";

import { PRODUCT_FIELDS_MESSAGES } from "./productFieldsMessages";

export { PRODUCT_FIELDS_MESSAGES };

interface ProductFieldsProps {
  className?: string;
  legend?: string;
  initialShop?: MatchedShopResult | null;
  hideProductUrl?: boolean;
  showFieldStatus?: boolean;
}

export function ProductFields({
  className,
  legend = PRODUCT_FIELDS_MESSAGES.legend,
  initialShop = null,
  hideProductUrl = false,
  showFieldStatus = false,
}: ProductFieldsProps) {
  const [selectedShop, setSelectedShop] = useState<MatchedShopResult | null>(
    initialShop,
  );
  const [prevInitialShop, setPrevInitialShop] =
    useState<MatchedShopResult | null>(initialShop);

  if (prevInitialShop !== initialShop) {
    setPrevInitialShop(initialShop);
    setSelectedShop(initialShop);
  }

  const [isPending, startTransition] = useTransition();
  const [hasScrapedLocally, setHasScrapedLocally] = useState(false);

  const isStatusActive = Boolean(showFieldStatus || hasScrapedLocally);

  return (
    <FieldSet className={className}>
      {legend && <FieldLegend>{legend}</FieldLegend>}
      <FieldGroup className="gap-3 sm:gap-4">
        <ProductNameField showStatus={isStatusActive} disabled={isPending} />

        <ProductUrlField
          hideProductUrl={hideProductUrl}
          isPending={isPending}
          startTransition={startTransition}
          onScrapeSuccess={(shop) => {
            if (shop) setSelectedShop(shop);
          }}
          onShopMatched={(shop) => {
            setSelectedShop(shop);
          }}
          onScrapeFinished={() => {
            setHasScrapedLocally(true);
          }}
        />

        <ProductShopSelector
          selectedShop={selectedShop}
          onSelectShop={setSelectedShop}
          disabled={isPending}
          showFieldStatus={isStatusActive}
        />

        <ProductImageField showStatus={isStatusActive} disabled={isPending} />

        <ProductCodeField showStatus={isStatusActive} disabled={isPending} />
      </FieldGroup>
    </FieldSet>
  );
}
