import Link from "next/link";
import {
  Package,
  MessageSquare,
  Calendar,
  Star,
  ArrowRight,
} from "lucide-react";
import type { ProductListItem } from "@/serverActions/productsGet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPolishDate, formatReviewCount } from "@/lib/formatters";
import { cn } from "cn";

export interface ProductsListProps {
  products: ProductListItem[];
}

export function ProductsList({ products }: ProductsListProps) {
  if (products.length === 0) {
    return (
      <Card className="border-dashed p-10 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <Package className="size-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Brak produktów
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
          W bazie nie ma jeszcze żadnych produktów. Dodaj opinię, aby utworzyć
          pierwszy produkt.
        </p>
        <div className="mt-6">
          <Link href="/opinie/dodaj" className={buttonVariants()}>
            Dodaj produkt i opinię
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full" data-slot="products-list">
      {products.map((product) => (
        <Link href={`/produkty/${product.id}`} key={product.id} className="group">
          <Card className="transition-all hover:border-primary/50 hover:shadow-sm py-1 md:py-5">
            <CardContent className="p-1 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Product Thumbnail & Main Details */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="size-20 rounded-lg md:bg-muted md:border flex items-center justify-center shrink-0 overflow-hidden">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="size-full object-contain p-1"
                      />
                    ) : (
                      <Package className="size-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-md md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-4">
                        {product.name}
                      </span>

                      {product.code && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {product.code}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {/* Number of reviews */}
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <MessageSquare className="size-3.5 text-muted-foreground" />
                        {formatReviewCount(product.rate_count)}
                      </span>

                      {/* Average Rating if available */}
                      {product.rate_count > 0 && (
                        <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                          <Star className="size-3.5 fill-amber-400 text-amber-500" />
                          {product.rate_avg.toFixed(1)} / 5
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
