"use client";

import { useState, useTransition, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Trash2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComboboxResponsive } from "@/components/ui/combobox-responsive";
import { FormFieldCard } from "@/components/ui/form-field-card";
import { shopsGet, type ShopItem } from "@/serverActions/shopsGet";
import type { ProductCreateInput } from "@/schemas/product";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import { ShopLogo } from "@/components/shops/ShopLogo";

export const SHOP_SELECTOR_MESSAGES = {
  helperText:
    "Jeśli nie znasz sklepu lub nie ma go na liście pozostaw pole puste.",
  selectedShop: "Wybrany sklep",
  selectFromList: "Wybierz z listy",
  change: "Zmień",
  deleteShopAriaLabel: "Usuń sklep",
  deleteButton: "Usuń",
} as const;

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

  const [shopsList, setShopsList] = useState<ShopItem[] | null>(null);
  const [isLoadingShops, startTransition] = useTransition();

  const loadShopsIfNeeded = useCallback(() => {
    if (shopsList === null && !isLoadingShops) {
      startTransition(async () => {
        try {
          const data = await shopsGet();
          setShopsList(data);
        } catch {
          setShopsList([]);
        }
      });
    }
  }, [shopsList, isLoadingShops]);

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
      label="Sklep"
      isFilled={isShopFilled}
      showStatus={showFieldStatus}
      filledBadgeText="Uzupełnione"
      missingBadgeText="Do uzupełnienia"
    >
      {selectedShop ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-white p-3 text-card-foreground shadow-2xs md:flex-row dark:bg-card">
          <div className="flex min-w-0 items-center gap-3">
            <ShopLogo
              logo={selectedShop.logo}
              name={selectedShop.name}
              size="lg"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {selectedShop.name || "Nieznany sklep"}
              </span>
              <span className="text-xs text-muted-foreground">
                {SHOP_SELECTOR_MESSAGES.selectedShop}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ComboboxResponsive<ShopItem>
              items={shopsList || []}
              value={shopId || ""}
              onValueChange={handleValueChange}
              getItemValue={(item) => item.id}
              getItemLabel={(item) => item.name || "Sklep"}
              dialogTitle="Wybierz sklep"
              searchPlaceholder="Szukaj sklepu..."
              emptyText="Nie znaleziono sklepu."
              loading={isLoadingShops}
              loadingText="Wczytywanie listy sklepów..."
              disabled={disabled}
              onOpenChange={(open) => {
                if (open) loadShopsIfNeeded();
              }}
              renderTrigger={() => (
                <span className="flex items-center gap-1.5 text-xs font-normal">
                  <RefreshCw className="size-3" />
                  {SHOP_SELECTOR_MESSAGES.change}
                </span>
              )}
              triggerClassName="h-8 px-2.5 text-xs"
              renderItem={(item, isSelected) => (
                <div className="flex w-full items-center justify-between gap-2 py-1">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <ShopLogo logo={item.logo} name={item.name} size="sm" />
                    <span className="truncate">{item.name || "Sklep"}</span>
                  </div>
                  {isSelected && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </div>
              )}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={SHOP_SELECTOR_MESSAGES.deleteShopAriaLabel}
              disabled={disabled}
              onClick={handleClearShop}
              className="text-muted-foreground hover:border-destructive/40 hover:text-destructive sm:w-auto"
            >
              <Trash2 className="mr-1 size-3.5" />{" "}
              {SHOP_SELECTOR_MESSAGES.deleteButton}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed bg-white p-3 text-sm text-muted-foreground sm:flex-row sm:items-center dark:bg-card">
          <ComboboxResponsive<ShopItem>
            items={shopsList || []}
            value={shopId || ""}
            onValueChange={handleValueChange}
            getItemValue={(item) => item.id}
            getItemLabel={(item) => item.name || "Sklep"}
            dialogTitle="Wybierz sklep z listy"
            searchPlaceholder="Szukaj sklepu..."
            emptyText="Nie znaleziono sklepu."
            loading={isLoadingShops}
            loadingText="Wczytywanie listy sklepów..."
            disabled={disabled}
            onOpenChange={(open) => {
              if (open) loadShopsIfNeeded();
            }}
            renderTrigger={() => (
              <span className="text-xs font-medium">
                {SHOP_SELECTOR_MESSAGES.selectFromList}
              </span>
            )}
            triggerClassName="h-10 sm:h-8 w-full sm:w-auto px-3 text-xs shrink-0 font-medium"
            renderItem={(item, isSelected) => (
              <div className="flex w-full items-center justify-between gap-2 py-1">
                <div className="flex min-w-0 items-center gap-2.5">
                  <ShopLogo logo={item.logo} name={item.name} size="sm" />
                  <span className="truncate">{item.name || "Sklep"}</span>
                </div>
                {isSelected && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </div>
            )}
          />
        </div>
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        {SHOP_SELECTOR_MESSAGES.helperText}
      </p>
    </FormFieldCard>
  );
}
