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
