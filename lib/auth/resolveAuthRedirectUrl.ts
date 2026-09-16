import { getReviewDraftReturnUrl } from "@/lib/storage/reviewDraftStorage";

export function resolveAuthRedirectUrl(
  callbackUrl: string | null | undefined,
  defaultFallback = "/dashboard",
): string {
  return callbackUrl && callbackUrl !== "/dashboard"
    ? callbackUrl
    : getReviewDraftReturnUrl(defaultFallback);
}
