import { ShopCombobox } from "./ShopCombobox";
import type { ShopItem } from "@/serverActions/shopsGet";

interface EmptyShopPlaceholderProps {
  shopId: string;
  onValueChange: (shopId: string, item?: ShopItem) => void;
  disabled?: boolean;
  shopsList: ShopItem[] | null;
  isLoading: boolean;
  onOpen: () => void;
}

export function EmptyShopPlaceholder({
  shopId,
  onValueChange,
  disabled = false,
  shopsList,
  isLoading,
  onOpen,
}: EmptyShopPlaceholderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed bg-card p-3 text-sm text-muted-foreground sm:flex-row sm:items-center">
      <ShopCombobox
        variant="select"
        value={shopId}
        onValueChange={onValueChange}
        disabled={disabled}
        shopsList={shopsList}
        isLoading={isLoading}
        onOpen={onOpen}
      />
    </div>
  );
}
