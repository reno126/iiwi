"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { SelectionCard } from "@/components/ui/selection-card";
import type { Product } from "@/prisma/generated/client";

interface SelectedProductCardProps {
  product: Product;
  onReselect: () => void;
}

export function SelectedProductCard({
  product,
  onReselect,
}: SelectedProductCardProps) {
  return (
    <SelectionCard
      variant="primary"
      media={
        <ProductThumbnail
          src={product.imageUrl}
          alt={product.name}
          size="xs"
          className="size-10 shrink-0 rounded-md border bg-background"
        />
      }
      title={product.name}
      badge={
        <Badge variant="outline" className="shrink-0 text-xs">
          Wybrany produkt
        </Badge>
      }
      description={product.code ? `Kod: ${product.code}` : undefined}
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReselect}
          className="w-full shrink-0 gap-1.5 sm:w-auto"
        >
          <RotateCcw className="size-3.5" />
          Zmień produkt
        </Button>
      }
    />
  );
}
