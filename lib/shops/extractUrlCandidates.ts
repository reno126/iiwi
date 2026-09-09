/**
 * Pomocnicza funkcja do deterministycznej ekstrakcji kandydatów domenowych i etykiet z adresu URL.
 * Zwraca tablicę unikalnych ciągów znaków posortowaną od najbardziej specyficznych (pełna domena)
 * do ogólnych (tokeny SLD).
 */
export function extractUrlCandidates(rawUrl: string | null | undefined): string[] {
  if (!rawUrl || typeof rawUrl !== "string") return [];

  let trimmed = rawUrl.trim().toLowerCase();
  if (!trimmed) return [];

  // Automatyczne uzupełnienie brakującego protokołu
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let hostname: string;
  try {
    const parsed = new URL(trimmed);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return [];
  }

  // Usunięcie wiodącego www.
  hostname = hostname.replace(/^www\./, "");
  if (!hostname || !hostname.includes(".")) {
    return [];
  }

  const candidates: string[] = [];

  // 1. Pełny hostname (bez www.), np. "mediaexpert.pl", "zakupy.biedronka.pl"
  candidates.push(hostname);

  const parts = hostname.split(".");

  // 2. Wykrywanie domeny głównej (Root Domain)
  // Obsługa domen dwustopniowych (np. .com.pl, .net.pl, .org.pl, .co.uk)
  const isSecondLevelDomain =
    parts.length >= 3 &&
    (parts[parts.length - 2] === "com" ||
      parts[parts.length - 2] === "net" ||
      parts[parts.length - 2] === "org" ||
      parts[parts.length - 2] === "co" ||
      parts[parts.length - 2] === "edu" ||
      parts[parts.length - 2] === "gov") &&
    (parts[parts.length - 1] === "pl" || parts[parts.length - 1] === "uk");

  if (isSecondLevelDomain && parts.length > 3) {
    const rootDomain = parts.slice(-3).join(".");
    if (rootDomain !== hostname) {
      candidates.push(rootDomain);
    }
  } else if (!isSecondLevelDomain && parts.length > 2) {
    const rootDomain = parts.slice(-2).join(".");
    if (rootDomain !== hostname) {
      candidates.push(rootDomain);
    }
  }

  // 3. Etykiety/tokeny bazowe (SLD) z odfiltrowaniem generycznych słów i TLD
  const ignoredLabels = new Set([
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

  for (const label of parts) {
    if (!ignoredLabels.has(label) && label.length >= 3) {
      candidates.push(label);

      // Jeśli etykieta zawiera myślniki, np. "media-expert", dodaj też wersję "mediaexpert"
      if (label.includes("-")) {
        const withoutDashes = label.replace(/-/g, "");
        if (withoutDashes.length >= 3 && !ignoredLabels.has(withoutDashes)) {
          candidates.push(withoutDashes);
        }
      }
    }
  }

  // Zwracamy unikalną listę zachowując kolejność priorytetów
  return Array.from(new Set(candidates));
}
