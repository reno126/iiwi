import { recentReviewsGet } from "@/serverActions/recentReviewsGet";
import { RecentReviewsBanner } from "./RecentReviewsBanner";

export async function RecentReviewsSection() {
  const recentReviews = await recentReviewsGet(3);
  return <RecentReviewsBanner reviews={recentReviews} />;
}
