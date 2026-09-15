function ensureHttpProtocolPrefix(url: string): string {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

function stripLeadingWww(hostname: string): string {
  return hostname.replace(/^www\./, "");
}

function isTwoPartTopLevelDomain(parts: string[]): boolean {
  if (parts.length < 3) {
    return false;
  }

  const secondToLast = parts[parts.length - 2];
  const last = parts[parts.length - 1];

  const commonSecondLevelLabels = new Set([
    "com",
    "net",
    "org",
    "co",
    "edu",
    "gov",
  ]);

  const commonTwoPartTlds = new Set(["pl", "uk"]);

  return commonSecondLevelLabels.has(secondToLast) && commonTwoPartTlds.has(last);
}

function extractRootDomain(hostname: string, parts: string[]): string | null {
  const isTwoPartTld = isTwoPartTopLevelDomain(parts);

  if (isTwoPartTld && parts.length > 3) {
    const rootDomain = parts.slice(-3).join(".");
    return rootDomain !== hostname ? rootDomain : null;
  }

  if (!isTwoPartTld && parts.length > 2) {
    const rootDomain = parts.slice(-2).join(".");
    return rootDomain !== hostname ? rootDomain : null;
  }

  return null;
}

const ignoredGenericShopLabels = new Set([
  "pl",
  "com",
  "eu",
  "net",
  "org",
  "info",
  "biz",
  "co",
  "uk",
  "de",
  "sklep",
  "shop",
  "outlet",
  "m",
  "mobile",
  "app",
  "store",
  "www",
  "online",
  "zakupy",
  "e-sklep",
]);

function extractBaseShopLabels(parts: string[]): string[] {
  const labels: string[] = [];

  for (const label of parts) {
    const isValidLabel = !ignoredGenericShopLabels.has(label) && label.length >= 3;
    if (isValidLabel) {
      labels.push(label);

      if (label.includes("-")) {
        const withoutDashes = label.replace(/-/g, "");
        if (withoutDashes.length >= 3 && !ignoredGenericShopLabels.has(withoutDashes)) {
          labels.push(withoutDashes);
        }
      }
    }
  }

  return labels;
}

export function extractUrlCandidates(rawUrl: string | null | undefined): string[] {
  if (!rawUrl || typeof rawUrl !== "string") return [];

  const trimmed = rawUrl.trim().toLowerCase();
  if (!trimmed) return [];

  const normalizedUrl = ensureHttpProtocolPrefix(trimmed);

  let hostname: string;
  try {
    const parsed = new URL(normalizedUrl);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return [];
  }

  hostname = stripLeadingWww(hostname);
  if (!hostname || !hostname.includes(".")) {
    return [];
  }

  const candidates: string[] = [hostname];
  const parts = hostname.split(".");

  const rootDomain = extractRootDomain(hostname, parts);
  if (rootDomain) {
    candidates.push(rootDomain);
  }

  const baseLabels = extractBaseShopLabels(parts);
  candidates.push(...baseLabels);

  return Array.from(new Set(candidates));
}
