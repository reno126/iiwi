import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { productsGet } from "@/serverActions/productsGet";
import { ProductsList } from "./_components/ProductsList";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Produkty | TrueReview",
  description: "Przeglądaj wszystkie produkty i rzetelne opinie użytkowników w serwisie TrueReview.",
};

export default async function ProductsPage() {
  const products = await productsGet();

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      {/* Header section with page title & action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Produkty
          </h1>
          <p className="text-sm text-muted-foreground">
            Przeglądaj wszystkie produkty i rzetelne opinie użytkowników
          </p>
        </div>

        <Button
          render={<Link href="/opinie/dodaj" />}
          className="shrink-0 gap-1.5 self-start sm:self-center"
        >
          <PlusCircle className="size-4" />
          Dodaj opinię
        </Button>
      </div>

      {/* Product List: Always renders 1 product per row on each resolution */}
      <ProductsList products={products} />
    </div>
  );
}
