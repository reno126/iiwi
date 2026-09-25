import { memo } from "react";
import {
  Calendar,
  ExternalLink,
  User,
  PlusCircle,
  Tag,
  Clock,
} from "lucide-react";
import type { ProductWithReviews } from "@/serverActions/productGetById";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { PropertyRow } from "@/components/ui/property-row";
import { ResponsiveDateTime } from "@/components/ui/responsive-date-time";
import { formatUserDisplayName } from "@/lib/formatters";
import { PRODUCT_DETAILS_MESSAGES } from "./ProductDetails";

interface ProductOverviewCardProps {
  product: ProductWithReviews;
  onAddReview: () => void;
  isReviewFormOpen: boolean;
}

const MemoizedProductOverviewCard = memo(function MemoizedProductOverviewCard({
  product,
  onAddReview,
  isReviewFormOpen,
}: ProductOverviewCardProps) {
  const creatorDisplayName = formatUserDisplayName(product.creator);

  const hasDistinctUpdateDate =
    product.updatedAt.getTime() - product.createdAt.getTime() > 60000;

  return (
    <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <ProductThumbnail
            src={product.imageUrl}
            alt={product.name}
            size="xl"
            priority={true}
            className="mx-auto size-36 rounded-xl border border-border/70 bg-muted/20 sm:mx-0 sm:size-44"
          />

          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Heading level={1}>{product.name}</Heading>
                {product.code && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Tag className="size-3" />
                    {product.code}
                  </Badge>
                )}
              </div>

              <RatingSummary
                rate={product.rate_avg}
                count={product.rate_count}
                size="md"
                showEmptyText={true}
              />
            </div>

            <Separator />

            <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-xs text-muted-foreground sm:grid-cols-2">
              {product.productUrl && (
                <PropertyRow
                  semantic="dl"
                  label="Strona produktu:"
                  className="min-w-0 sm:col-span-2"
                  labelClassName="shrink-0"
                  valueClassName="min-w-0 flex-1"
                  value={
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={product.productUrl}
                      className="inline-flex max-w-full min-w-0 items-center gap-1 text-primary hover:underline"
                    >
                      <span className="truncate">{product.productUrl}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  }
                />
              )}

              {product.code && (
                <PropertyRow
                  semantic="dl"
                  label="Kod produktu"
                  valueClassName="font-mono text-foreground"
                  value={product.code}
                />
              )}

              <PropertyRow
                semantic="dl"
                label="Dodany przez:"
                icon={User}
                value={creatorDisplayName}
              />

              <PropertyRow
                semantic="dl"
                label="Data utworzenia:"
                icon={Calendar}
                value={<ResponsiveDateTime date={product.createdAt} />}
              />

              {hasDistinctUpdateDate && (
                <PropertyRow
                  semantic="dl"
                  label="Ostatnia modyfikacja:"
                  icon={Clock}
                  value={<ResponsiveDateTime date={product.updatedAt} />}
                />
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
                {PRODUCT_DETAILS_MESSAGES.addReviewButton}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export function ProductOverviewCard({
  product,
  onAddReview,
  isReviewFormOpen,
}: ProductOverviewCardProps) {
  return (
    <MemoizedProductOverviewCard
      product={product}
      onAddReview={onAddReview}
      isReviewFormOpen={isReviewFormOpen}
    />
  );
}
