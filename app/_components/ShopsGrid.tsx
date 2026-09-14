import type { ShopItem } from "@/serverActions/shopsGet";
import { ShopLogo } from "@/components/shops/ShopLogo";

interface ShopsGridProps {
  shops: ShopItem[];
}

export function ShopsGrid({ shops }: ShopsGridProps) {
  if (shops.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Brak sklepów w bazie.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      {shops.map((shop) => (
        <div
          key={shop.id}
          className="flex flex-col items-center justify-center p-4 rounded-xl border bg-white shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all text-center gap-2.5 h-28 sm:h-32"
        >
          <div className="h-12 w-full flex items-center justify-center p-1">
            <ShopLogo
              logo={shop.logo}
              name={shop.name}
              size="lg"
              className="border-0 shadow-none bg-transparent"
            />
          </div>
          <span className="text-xs sm:text-sm font-medium text-foreground line-clamp-1 w-full px-1">
            {shop.name || "Sklep"}
          </span>
        </div>
      ))}
    </div>
  );
}
