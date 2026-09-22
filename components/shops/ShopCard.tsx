import { Card } from "@/components/ui/card";
import { ShopLogo } from "@/components/shops/ShopLogo";
import type { ShopItem } from "@/serverActions/shopsGet";
import { cn } from "cn";

interface ShopCardProps {
  shop: ShopItem;
  className?: string;
}

export function ShopCard({ shop, className }: ShopCardProps) {
  return (
    <Card
      className={cn(
        "flex h-28 flex-col items-center justify-center gap-2.5 p-4 text-center transition-all sm:h-32",
        className,
      )}
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
  );
}
