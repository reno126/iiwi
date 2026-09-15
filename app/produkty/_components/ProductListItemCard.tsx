import Link from "next/link";
import { MessageSquare, Store } from "lucide-react";
import type { ProductListItem } from "@/serverActions/productsGet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { StarRating } from "@/components/reviews/StarRating";
import { formatReviewCount } from "@/lib/formatters";

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
      <Card className="transition-all hover:border-primary/50 hover:shadow-sm py-1 md:py-5">
        <CardContent className="p-1 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <ProductThumbnail
                src={product.imageUrl}
                alt={product.name}
                size="lg"
                priority={priority}
                className="size-20 rounded-lg md:bg-muted md:border shrink-0"
              />

              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-md md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-3">
                    {product.name}
                  </span>

                  {product.code && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {product.code}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <MessageSquare className="size-3.5 text-muted-foreground" />
                    {formatReviewCount(product.rate_count)}
                  </span>

                  {product.rate_count > 0 && (
                    <StarRating
                      rate={product.rate_avg}
                      size="sm"
                      showValue
                      className="text-amber-600 dark:text-amber-400"
                    />
                  )}
                </div>
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
