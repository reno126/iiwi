"use client";

import { useState, useTransition, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { Store, Trash2, Check, RefreshCw, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComboboxResponsive } from "@/components/ui/combobox-responsive";
import { Field, FieldLabel } from "@/components/ui/field";
import { shopsGet, type ShopItem } from "@/serverActions/shopsGet";
import type { ProductCreateInput } from "@/schemas/product";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import { ShopLogo } from "@/components/shops/ShopLogo";
import { cn } from "cn";

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
  const { setValue, watch } = useFormContext<ProductCreateInput>();
  const shopId = watch("shopId");
  const isShopFilled = Boolean(selectedShop || (shopId && shopId.trim().length > 0));

  const [shopsList, setShopsList] = useState<ShopItem[] | null>(null);
  const [isLoadingShops, startTransition] = useTransition();

  // Leniwe pobieranie słownika sklepów na żądanie (on-demand)
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
    <Field
      className={cn(
        "rounded-xl p-3.5 sm:p-4 shadow-2xs transition-all",
        showFieldStatus && isShopFilled
          ? "border-2 border-emerald-500 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-950/20"
          : showFieldStatus
            ? "border-2 border-gray-300 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-900/30"
            : "border border-border/80 bg-white focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <FieldLabel
          className={cn(
            "text-sm font-medium",
            showFieldStatus && isShopFilled
              ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold shadow-xs"
              : showFieldStatus
                ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-600 text-white font-semibold shadow-xs"
                : "text-foreground"
          )}
        >
          {showFieldStatus && (
            isShopFilled ? (
              <Check className="size-3.5 sm:size-4 stroke-[2.5]" />
            ) : (
              <CircleAlert className="size-3.5 sm:size-4" />
            )
          )}
          <span>Sklep</span>
        </FieldLabel>

        {showFieldStatus && (
          <span
            className={cn(
              "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
              isShopFilled
                ? "text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-900/40"
                : "text-gray-600 bg-gray-200/90 dark:text-gray-300 dark:bg-gray-800/60"
            )}
          >
            {isShopFilled ? "Uzupełnione" : "Do uzupełnienia"}
          </span>
        )}
      </div>

      {selectedShop ? (
        // Stan 1: Sklep jest wybrany (rozpoznany ze scrapera lub wybrany ręcznie)
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-lg border bg-white dark:bg-card text-card-foreground shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <ShopLogo
              logo={selectedShop.logo}
              name={selectedShop.name}
              size="lg"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate">
                {selectedShop.name || "Nieznany sklep"}
              </span>
              <span className="text-xs text-muted-foreground">Wybrany sklep</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
                  Zmień
                </span>
              )}
              triggerClassName="h-8 px-2.5 text-xs"
              renderItem={(item, isSelected) => (
                <div className="flex w-full items-center justify-between gap-2 py-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShopLogo logo={item.logo} name={item.name} size="sm" />
                    <span className="truncate">{item.name || "Sklep"}</span>
                  </div>
                  {isSelected && (
                    <Check className="size-4 text-primary shrink-0" />
                  )}
                </div>
              )}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Usuń sklep"
              disabled={disabled}
              onClick={handleClearShop}
                className="sm:w-auto text-muted-foreground hover:text-destructive hover:border-destructive/40"
            >
              <Trash2 className="size-3.5 mr-1" /> Usuń
            </Button>
          </div>
        </div>
      ) : (
        // Stan 2: Brak wybranego sklepu (pusty / oczekujący na link)
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-dashed text-sm text-muted-foreground bg-white dark:bg-card">

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
              <span className="text-xs font-medium">Wybierz z listy</span>
            )}
            triggerClassName="h-10 sm:h-8 w-full sm:w-auto px-3 text-xs shrink-0 font-medium"
            renderItem={(item, isSelected) => (
              <div className="flex w-full items-center justify-between gap-2 py-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.logo ? (
                    <div className="flex size-6 shrink-0 items-center justify-center rounded border bg-white p-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.logo}
                        alt={item.name || ""}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <Store className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate">{item.name || "Sklep"}</span>
                </div>
                {isSelected && (
                  <Check className="size-4 text-primary shrink-0" />
                )}
              </div>
            )}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Jeśli nie znasz sklepu lub nie ma go na liście pozostaw pole puste.
      </p>
    </Field>
  );
}
