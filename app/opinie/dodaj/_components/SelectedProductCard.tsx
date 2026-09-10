"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, RotateCcw } from "lucide-react";
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
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-md bg-background border flex items-center justify-center shrink-0">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="size-12 object-contain rounded"
              />
            ) : (
              <Package className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
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
          className="shrink-0 gap-1.5"
        >
          <RotateCcw className="size-3.5" />
          Zmień produkt
        </Button>
      </CardContent>
    </Card>
  );
}
