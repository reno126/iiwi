import { getReviewDraftReturnUrl } from "@/lib/storage/reviewDraftStorage";
import { isSafeRedirectUrl } from "./isSafeRedirectUrl";

export { isSafeRedirectUrl };

export function resolveAuthRedirectUrl(
  callbackUrl: string | null | undefined,
  defaultFallback = "/dashboard",
): string {
  if (
    callbackUrl &&
    isSafeRedirectUrl(callbackUrl) &&
    callbackUrl !== "/dashboard"
  ) {
    return callbackUrl.trim();
  }

  const draftUrl = getReviewDraftReturnUrl(defaultFallback);
  if (isSafeRedirectUrl(draftUrl)) {
    return draftUrl;
  }

  return isSafeRedirectUrl(defaultFallback) ? defaultFallback : "/dashboard";
}
