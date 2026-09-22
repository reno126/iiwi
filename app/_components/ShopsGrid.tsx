import { ShopCard } from "@/components/shops/ShopCard";
import type { ShopItem } from "@/serverActions/shopsGet";
import { Empty, EmptyDescription } from "@/components/ui/empty";

interface ShopsGridProps {
  shops: ShopItem[];
}

export function ShopsGrid({ shops }: ShopsGridProps) {
  if (shops.length === 0) {
    return (
      <Empty className="border p-8 text-center">
        <EmptyDescription>Brak sklepów do wyświetlenia.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </div>
  );
}
