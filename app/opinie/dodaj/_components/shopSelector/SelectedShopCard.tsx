import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopLogo } from "@/components/shops/ShopLogo";
import { SelectionCard } from "@/components/ui/selection-card";
import { ShopCombobox } from "./ShopCombobox";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import type { ShopItem } from "@/serverActions/shopsGet";
import { SHOP_SELECTOR_MESSAGES } from "../shopSelectorMessages";

interface SelectedShopCardProps {
  selectedShop: MatchedShopResult;
  shopId: string;
  onValueChange: (shopId: string, item?: ShopItem) => void;
  onClear: (event: React.MouseEvent) => void;
  disabled?: boolean;
  shopsList: ShopItem[] | null;
  isLoading: boolean;
  onOpen: () => void;
}

export function SelectedShopCard({
  selectedShop,
  shopId,
  onValueChange,
  onClear,
  disabled = false,
  shopsList,
  isLoading,
  onOpen,
}: SelectedShopCardProps) {
  return (
    <SelectionCard
      variant="default"
      media={
        <ShopLogo logo={selectedShop.logo} name={selectedShop.name} size="lg" />
      }
      title={selectedShop.name || SHOP_SELECTOR_MESSAGES.unknownShop}
      description={SHOP_SELECTOR_MESSAGES.selectedShop}
      actions={
        <>
          <ShopCombobox
            variant="change"
            value={shopId}
            onValueChange={onValueChange}
            disabled={disabled}
            shopsList={shopsList}
            isLoading={isLoading}
            onOpen={onOpen}
          />

          <Button
            type="button"
            variant="destructive"
            size="sm"
            aria-label={SHOP_SELECTOR_MESSAGES.deleteShopAriaLabel}
            disabled={disabled}
            onClick={onClear}
          >
            <Trash2 className="mr-1 size-3.5" />
            {SHOP_SELECTOR_MESSAGES.deleteButton}
          </Button>
        </>
      }
    />
  );
}
