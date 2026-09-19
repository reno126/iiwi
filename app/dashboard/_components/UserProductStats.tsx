import Link from "next/link";
import { formatRatedProductsCount } from "@/lib/formatters";
import type { UserDashboardProductItem } from "@/serverActions/userDashboardGet";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";
import { Star } from "lucide-react";

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
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {DASHBOARD_MESSAGES.statsHeading}
        </h2>
        <p className="text-sm sm:text-base font-medium text-foreground">
          {formatRatedProductsCount(totalReviewedProducts)}
        </p>
      </div>

      {reviewedProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {DASHBOARD_MESSAGES.emptyProductsMessage}
        </p>
      ) : (
        <ul role="list" className="space-y-2 pt-1">
          {reviewedProducts.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center gap-2 min-w-0 truncate">
                <Link
                  href={`/produkty/${item.productId}`}
                  className="font-medium text-foreground hover:text-primary hover:underline transition-colors truncate"
                >
                  {item.productName}
                </Link>
                {item.userReviewsCount > 1 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({DASHBOARD_MESSAGES.userRatingsLabel} {item.userReviewsCount})
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 shrink-0 text-xs sm:text-sm font-semibold text-muted-foreground">
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
