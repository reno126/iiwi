import Link from "next/link";
import { Package } from "lucide-react";
import type { ProductListItem } from "@/serverActions/productsGet";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { ProductListItemCard } from "./ProductListItemCard";

export interface ProductsListProps {
  products: ProductListItem[];
}

export function ProductsList({ products }: ProductsListProps) {
  if (products.length === 0) {
    return (
      <Empty className="border p-10 text-center">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Brak produktów</EmptyTitle>
          <EmptyDescription>
            W bazie nie ma jeszcze żadnych produktów. Dodaj opinię, aby utworzyć
            pierwszy produkt.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/opinie/dodaj" className={buttonVariants()}>
            Dodaj produkt i opinię
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4" data-slot="products-list">
      {products.map((product, index) => (
        <ProductListItemCard
          key={product.id}
          product={product}
          priority={index < 3}
        />
      ))}
    </div>
  );
}
