import {
  Calendar,
  ExternalLink,
  User,
  MessageSquare,
  PlusCircle,
  Tag,
  Clock,
} from "lucide-react";
import type { ProductWithReviews } from "@/serverActions/productGetById";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/reviews/StarRating";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { formatPolishDate, formatReviewCount } from "@/lib/formatters";

interface ProductOverviewCardProps {
  product: ProductWithReviews;
  onAddReview: () => void;
  isReviewFormOpen: boolean;
}

export function ProductOverviewCard({
  product,
  onAddReview,
  isReviewFormOpen,
}: ProductOverviewCardProps) {
  const creatorDisplayName =
    product.creator.name ||
    product.creator.email.split("@")[0] ||
    "Użytkownik";

  const hasDistinctUpdateDate =
    product.updatedAt.getTime() - product.createdAt.getTime() > 60000;

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          <ProductThumbnail
            src={product.imageUrl}
            alt={product.name}
            size="xl"
            priority={true}
            className="size-36 sm:size-44 rounded-xl border mx-auto sm:mx-0"
          />

          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {product.name}
                </h1>
                {product.code && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Tag className="size-3" />
                    {product.code}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {product.rate_count > 0 ? (
                  <StarRating rate={product.rate_avg} size="md" showValue />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Brak ocen
                  </span>
                )}
                <span className="text-muted-foreground">•</span>
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  {formatReviewCount(product.rate_count)}
                </span>
              </div>
            </div>

            <Separator />

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-muted-foreground">
              {product.productUrl && (
                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <dt className="font-medium text-foreground">
                    Strona produktu:
                  </dt>
                  <dd className="truncate">
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <span className="truncate">{product.productUrl}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </dd>
                </div>
              )}

              {product.code && (
                <div className="flex items-center gap-1.5">
                  <dt className="font-medium text-foreground">Kod SKU / EAN:</dt>
                  <dd className="font-mono text-foreground">{product.code}</dd>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <dt className="font-medium text-foreground">Dodany przez:</dt>
                <dd className="flex items-center gap-1 text-foreground">
                  <User className="size-3.5 text-muted-foreground" />
                  {creatorDisplayName}
                </dd>
              </div>

              <div className="flex items-center gap-1.5">
                <dt className="font-medium text-foreground">Data utworzenia:</dt>
                <dd className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {formatPolishDate(product.createdAt, "d MMMM yyyy, HH:mm")}
                </dd>
              </div>

              {hasDistinctUpdateDate && (
                <div className="flex items-center gap-1.5">
                  <dt className="font-medium text-foreground">
                    Ostatnia modyfikacja:
                  </dt>
                  <dd className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatPolishDate(product.updatedAt, "d MMMM yyyy, HH:mm")}
                  </dd>
                </div>
              )}
            </dl>

            <div className="pt-2">
              <Button
                type="button"
                onClick={onAddReview}
                disabled={isReviewFormOpen}
                className="gap-1.5"
              >
                <PlusCircle className="size-4" />
                Napisz opinię dla tego produktu
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
