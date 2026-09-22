"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormFieldCard } from "@/components/ui/form-field-card";
import type { ProductCreateInput } from "@/schemas/product";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import type { ShopItem } from "@/serverActions/shopsGet";
import { useLazyShops } from "./useLazyShops";
import { SHOP_SELECTOR_MESSAGES } from "./shopSelectorMessages";
import { SelectedShopCard } from "./shopSelector/SelectedShopCard";
import { EmptyShopPlaceholder } from "./shopSelector/EmptyShopPlaceholder";

interface ProductShopSelectorProps {
  selectedShop: MatchedShopResult | null;
  onSelectShop: (shop: MatchedShopResult | null) => void;
  disabled?: boolean;
  showFieldStatus?: boolean;
}

export function ProductShopSelector({
  selectedShop,
  onSelectShop,
  disabled = false,
  showFieldStatus = false,
}: ProductShopSelectorProps) {
  const { setValue, control } = useFormContext<ProductCreateInput>();
  const shopId = useWatch({ control, name: "shopId" });
  const isShopFilled = Boolean(
    selectedShop || (shopId && shopId.trim().length > 0),
  );

  const { shopsList, isLoadingShops, loadShopsIfNeeded } = useLazyShops();

  const handleValueChange = (newShopId: string, item?: ShopItem) => {
    setValue("shopId", newShopId, { shouldValidate: true, shouldDirty: true });
    if (item) {
      onSelectShop({
        id: item.id,
        name: item.name,
        logo: item.logo,
      });
    } else {
      onSelectShop(null);
    }
  };

  const handleClearShop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setValue("shopId", "", { shouldValidate: true, shouldDirty: true });
    onSelectShop(null);
  };

  return (
    <FormFieldCard
      label={SHOP_SELECTOR_MESSAGES.fieldLabel}
      isFilled={isShopFilled}
      showStatus={showFieldStatus}
      filledBadgeText={SHOP_SELECTOR_MESSAGES.statusFilled}
      missingBadgeText={SHOP_SELECTOR_MESSAGES.statusMissing}
    >
      {selectedShop ? (
        <SelectedShopCard
          selectedShop={selectedShop}
          shopId={shopId || ""}
          onValueChange={handleValueChange}
          onClear={handleClearShop}
          disabled={disabled}
          shopsList={shopsList}
          isLoading={isLoadingShops}
          onOpen={loadShopsIfNeeded}
        />
      ) : (
        <EmptyShopPlaceholder
          shopId={shopId || ""}
          onValueChange={handleValueChange}
          disabled={disabled}
          shopsList={shopsList}
          isLoading={isLoadingShops}
          onOpen={loadShopsIfNeeded}
        />
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        {SHOP_SELECTOR_MESSAGES.helperText}
      </p>
    </FormFieldCard>
  );
}
