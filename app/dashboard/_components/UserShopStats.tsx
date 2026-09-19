import { formatReviewCount } from "@/lib/formatters";
import type { UserDashboardShopItem } from "@/serverActions/userDashboardGet";
import { Store } from "lucide-react";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";

interface UserShopStatsProps {
  reviewedShops: UserDashboardShopItem[];
}

export function UserShopStats({ reviewedShops }: UserShopStatsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Store className="size-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {DASHBOARD_MESSAGES.shopsHeading}
        </h3>
      </div>

      {reviewedShops.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {DASHBOARD_MESSAGES.emptyShopsMessage}
        </p>
      ) : (
        <ul role="list" className="space-y-2 pt-1">
          {reviewedShops.map((item) => (
            <li
              key={item.shopName}
              className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-b-0 last:pb-0"
            >
              <span className="truncate font-medium text-foreground">
                {item.shopName}
              </span>
              <span className="shrink-0 text-xs font-medium text-muted-foreground sm:text-sm">
                {formatReviewCount(item.reviewCount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
