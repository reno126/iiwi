import Link from "next/link";
import { formatRatedProductsCount } from "@/lib/formatters";
import type { UserDashboardProductItem } from "@/serverActions/userDashboardGet";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";
import { Star } from "lucide-react";
import {
  Heading,
  HeadingDescription,
  HeadingGroup,
} from "@/components/ui/heading";
import { Empty, EmptyDescription } from "@/components/ui/empty";

interface UserProductStatsProps {
  totalReviewedProducts: number;
  reviewedProducts: UserDashboardProductItem[];
}

export function UserProductStats({
  totalReviewedProducts,
  reviewedProducts,
}: UserProductStatsProps) {
  return (
    <div className="space-y-3">
      <HeadingGroup>
        <Heading level={2} size="xl">
          {DASHBOARD_MESSAGES.statsHeading}
        </Heading>
        <HeadingDescription className="font-medium text-foreground">
          {formatRatedProductsCount(totalReviewedProducts)}
        </HeadingDescription>
      </HeadingGroup>

      {reviewedProducts.length === 0 ? (
        <Empty className="p-6 text-center">
          <EmptyDescription>
            {DASHBOARD_MESSAGES.emptyProductsMessage}
          </EmptyDescription>
        </Empty>
      ) : (
        <ul role="list" className="space-y-2 pt-1">
          {reviewedProducts.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 text-sm last:border-b-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-2 truncate">
                <Link
                  href={`/produkty/${item.productId}`}
                  className="truncate font-medium text-foreground transition-colors hover:text-primary hover:underline"
                >
                  {item.productName}
                </Link>
                {item.userReviewsCount > 1 && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ({DASHBOARD_MESSAGES.userRatingsLabel}{" "}
                    {item.userReviewsCount})
                  </span>
                )}
              </div>
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground sm:text-sm">
                <Star className="size-3.5 fill-amber-400 text-amber-500" />
                <span>{item.rate.toFixed(1)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
