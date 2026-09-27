import { getReviewDraftReturnUrl } from "@/lib/storage/reviewDraftStorage";

export function isSafeRedirectUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }
  const trimmedUrl = url.trim();
  return (
    trimmedUrl.startsWith("/") &&
    !trimmedUrl.startsWith("//") &&
    !trimmedUrl.startsWith("/\\") &&
    !trimmedUrl.includes("\\")
  );
}

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
