import { ShopLogo } from "@/components/shops/ShopLogo";
import type { ShopItem } from "@/serverActions/shopsGet";
import { Card } from "@/components/ui/card";

interface ShopsGridProps {
  shops: ShopItem[];
}

export function ShopsGrid({ shops }: ShopsGridProps) {
  if (shops.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        Brak sklepów do wyświetlenia.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
      {shops.map((shop) => (
        <Card
          key={shop.id}
          className="flex h-28 flex-col items-center justify-center gap-2.5 p-4 text-center transition-all sm:h-32"
        >
          <div className="flex h-12 w-full items-center justify-center p-1">
            <ShopLogo
              logo={shop.logo}
              name={shop.name}
              size="lg"
              className="border-0 bg-transparent shadow-none"
            />
          </div>
          <span className="line-clamp-1 w-full px-1 text-xs font-medium text-foreground sm:text-sm">
            {shop.name || "Sklep"}
          </span>
        </Card>
      ))}
    </div>
  );
}
