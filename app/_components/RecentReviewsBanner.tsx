import type { RecentReviewItem } from "@/serverActions/recentReviewsGet";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { RecentReviewCard } from "./RecentReviewCard";

interface RecentReviewsBannerProps {
  reviews: RecentReviewItem[];
}

export function RecentReviewsBanner({ reviews }: RecentReviewsBannerProps) {
  if (reviews.length === 0) {
    return (
      <Empty className="border p-8 text-center">
        <EmptyDescription>
          Brak dodanych opinii. Bądź pierwszą osobą, która doda opinię!
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
      {reviews.map((review) => (
        <RecentReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
