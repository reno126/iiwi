import { RefreshCw, Check } from "lucide-react";
import { ComboboxResponsive } from "@/components/ui/combobox-responsive";
import { ShopLogo } from "@/components/shops/ShopLogo";
import type { ShopItem } from "@/serverActions/shopsGet";
import { SHOP_SELECTOR_MESSAGES } from "../shopSelectorMessages";

interface ShopComboboxProps {
  value: string;
  onValueChange: (shopId: string, item?: ShopItem) => void;
  variant: "select" | "change";
  disabled?: boolean;
  shopsList: ShopItem[] | null;
  isLoading: boolean;
  onOpen: () => void;
}

export function ShopCombobox({
  value,
  onValueChange,
  variant,
  disabled = false,
  shopsList,
  isLoading,
  onOpen,
}: ShopComboboxProps) {
  const isChangeVariant = variant === "change";

  return (
    <ComboboxResponsive<ShopItem>
      items={shopsList || []}
      value={value}
      onValueChange={onValueChange}
      getItemValue={(item) => item.id}
      getItemLabel={(item) =>
        item.name || SHOP_SELECTOR_MESSAGES.fallbackShopLabel
      }
      dialogTitle={
        isChangeVariant
          ? SHOP_SELECTOR_MESSAGES.dialogTitleChange
          : SHOP_SELECTOR_MESSAGES.dialogTitleSelect
      }
      searchPlaceholder={SHOP_SELECTOR_MESSAGES.searchPlaceholder}
      emptyText={SHOP_SELECTOR_MESSAGES.emptyText}
      loading={isLoading}
      loadingText={SHOP_SELECTOR_MESSAGES.loadingText}
      disabled={disabled}
      onOpenChange={(open) => {
        if (open) onOpen();
      }}
      renderTrigger={() =>
        isChangeVariant ? (
          <span className="flex items-center gap-1.5 text-xs font-normal">
            <RefreshCw className="size-3" />
            {SHOP_SELECTOR_MESSAGES.change}
          </span>
        ) : (
          <span className="text-xs font-medium">
            {SHOP_SELECTOR_MESSAGES.selectFromList}
          </span>
        )
      }
      triggerClassName={
        isChangeVariant
          ? "h-8 px-2.5 text-xs"
          : "h-10 sm:h-8 w-full sm:w-auto px-3 text-xs shrink-0 font-medium"
      }
      renderItem={(item, isSelected) => (
        <div className="flex w-full items-center justify-between gap-2 py-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <ShopLogo logo={item.logo} name={item.name} size="sm" />
            <span className="truncate">
              {item.name || SHOP_SELECTOR_MESSAGES.fallbackShopLabel}
            </span>
          </div>
          {isSelected && <Check className="size-4 shrink-0 text-primary" />}
        </div>
      )}
    />
  );
}
