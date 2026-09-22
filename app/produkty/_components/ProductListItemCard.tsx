import Link from "next/link";
import { Store } from "lucide-react";
import type { ProductListItem } from "@/serverActions/productsGet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { RatingSummary } from "@/components/reviews/RatingSummary";

interface ProductListItemCardProps {
  product: ProductListItem;
  priority?: boolean;
}

export function ProductListItemCard({
  product,
  priority = false,
}: ProductListItemCardProps) {
  return (
    <Link href={`/produkty/${product.id}`} className="group">
      <Card className="py-1 transition-all hover:border-primary/50 hover:shadow-sm md:py-5">
        <CardContent className="p-1 md:p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <ProductThumbnail
                src={product.imageUrl}
                alt={product.name}
                size="lg"
                priority={priority}
                className="size-20 shrink-0 rounded-lg md:border md:bg-muted"
              />

              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-md line-clamp-3 font-semibold text-foreground transition-colors group-hover:text-primary md:text-lg">
                    {product.name}
                  </span>

                  {product.code && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {product.code}
                    </Badge>
                  )}
                </div>

                <RatingSummary
                  rate={product.rate_avg}
                  count={product.rate_count}
                  size="sm"
                />
                {product?.shop?.name && (
                  <span className="flex items-center gap-1.5 text-xs text-foreground">
                    <Store className="size-4 text-muted-foreground" />{" "}
                    {product.shop.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
