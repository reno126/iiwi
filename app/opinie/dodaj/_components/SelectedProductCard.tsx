"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
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
    <Card className="border-primary/40 bg-primary/5 shadow-xs transition-all">
      <CardContent className="flex flex-col justify-between gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
        <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
          <ProductThumbnail
            src={product.imageUrl}
            alt={product.name}
            size="xs"
            className="size-10 shrink-0 rounded-md border bg-background"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-foreground">
                {product.name}
              </span>
              <Badge variant="outline" className="shrink-0 text-xs">
                Wybrany produkt
              </Badge>
            </div>
            {product.code && (
              <p className="truncate text-xs text-muted-foreground">
                Kod: {product.code}
              </p>
            )}
          </div>
        </div>

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
      </CardContent>
    </Card>
  );
}
