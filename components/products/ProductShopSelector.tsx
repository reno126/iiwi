"use client";

import { useState, useTransition, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { Store, Trash2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComboboxResponsive } from "@/components/ui/combobox-responsive";
import { Field, FieldLabel } from "@/components/ui/field";
import { shopsGet, type ShopItem } from "@/serverActions/shopsGet";
import type { ProductCreateInput } from "@/schemas/product";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";

interface ProductShopSelectorProps {
  selectedShop: MatchedShopResult | null;
  onSelectShop: (shop: MatchedShopResult | null) => void;
  disabled?: boolean;
}

export function ProductShopSelector({
  selectedShop,
  onSelectShop,
  disabled = false,
}: ProductShopSelectorProps) {
  const { setValue, watch } = useFormContext<ProductCreateInput>();
  const shopId = watch("shopId");

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
    <Field className="rounded-xl border border-border/80 bg-white p-3.5 sm:p-4 shadow-2xs transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
      <FieldLabel className="text-sm font-medium text-foreground">
        Sklep
      </FieldLabel>

      {selectedShop ? (
        // Stan 1: Sklep jest wybrany (rozpoznany ze scrapera lub wybrany ręcznie)
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20 text-card-foreground">
          <div className="flex items-center gap-3 min-w-0">
            {selectedShop.logo ? (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-md border bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedShop.logo}
                  alt={selectedShop.name || "Sklep"}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted">
                <Store className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate">
                {selectedShop.name || "Nieznany sklep"}
              </span>
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-dashed text-sm text-muted-foreground bg-muted/20">
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
