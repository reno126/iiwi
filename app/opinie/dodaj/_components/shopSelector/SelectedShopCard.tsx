import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopLogo } from "@/components/shops/ShopLogo";
import { ShopCombobox } from "./ShopCombobox";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import type { ShopItem } from "@/serverActions/shopsGet";
import { SHOP_SELECTOR_MESSAGES } from "../shopSelectorMessages";

interface SelectedShopCardProps {
  selectedShop: MatchedShopResult;
  shopId: string;
  onValueChange: (shopId: string, item?: ShopItem) => void;
  onClear: (e: React.MouseEvent) => void;
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
    <div className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-2xs md:flex-row">
      <div className="flex min-w-0 items-center gap-3">
        <ShopLogo logo={selectedShop.logo} name={selectedShop.name} size="lg" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">
            {selectedShop.name || SHOP_SELECTOR_MESSAGES.unknownShop}
          </span>
          <span className="text-xs text-muted-foreground">
            {SHOP_SELECTOR_MESSAGES.selectedShop}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
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
          variant="outline"
          size="sm"
          aria-label={SHOP_SELECTOR_MESSAGES.deleteShopAriaLabel}
          disabled={disabled}
          onClick={onClear}
          className="text-muted-foreground hover:border-destructive/40 hover:text-destructive sm:w-auto"
        >
          <Trash2 className="mr-1 size-3.5" />
          {SHOP_SELECTOR_MESSAGES.deleteButton}
        </Button>
      </div>
    </div>
  );
}
