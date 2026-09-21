import { useState, useTransition, useCallback } from "react";
import { shopsGet, type ShopItem } from "@/serverActions/shopsGet";

export function useLazyShops() {
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

  return {
    shopsList,
    isLoadingShops,
    loadShopsIfNeeded,
  };
}
