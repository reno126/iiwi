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
      <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <ProductThumbnail
            src={product.imageUrl}
            alt={product.name}
            size="xs"
            className="size-10 rounded-md border shrink-0 bg-background"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground truncate">
                {product.name}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                Wybrany produkt
              </Badge>
            </div>
            {product.code && (
              <p className="text-xs text-muted-foreground truncate">
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
          className="w-full sm:w-auto shrink-0 gap-1.5"
        >
          <RotateCcw className="size-3.5" />
          Zmień produkt
        </Button>
      </CardContent>
    </Card>
  );
}
