"use server";

import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";
import { productScrapeSchema } from "@/schemas/productScrape";
import { validateUrlSafety } from "@/lib/scraper/ssrfProtection";
import { extractProductMetadata } from "@/lib/scraper/extractMetadata";
import { fetchWithZenRows } from "@/lib/scraper/zenrowsClient";
import { returnServerError } from "next-safe-action";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
  "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

export const productScrapeMetadata = safeActionUserCtx
  .inputSchema(productScrapeSchema)
  .action(async ({ parsedInput }) => {
    const { productUrl } = parsedInput;

    // 1. Ochrona SSRF (Server-Side Request Forgery)
    const safetyCheck = validateUrlSafety(productUrl);
    if (!safetyCheck.isValid) {
      returnServerError(
        safetyCheck.error ?? "Podany adres URL jest niedozwolony ze względów bezpieczeństwa."
      );
    }

    // 2. Tier 1: Szybki bezpośredni fetch z nagłówkami przeglądarki (timeout 5s)
    let tier1Html: string | null = null;
    let shouldTryTier2 = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(productUrl, {
        method: "GET",
        headers: BROWSER_HEADERS,
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        tier1Html = await response.text();
      } else if (response.status === 403 || response.status === 503 || response.status === 429) {
        shouldTryTier2 = true;
      }
    } catch {
      // Błąd sieci lub timeout w Tier 1 – kwalifikuje do próby Tier 2
      shouldTryTier2 = true;
    }

    // Próba ekstrakcji z HTML uzyskanego w Tier 1
    if (tier1Html) {
      const metadata = extractProductMetadata(tier1Html, productUrl);
      if (metadata && metadata.imageUrl) {
        return metadata;
      }
      // Jeśli Tier 1 zwrócił HTML, ale nie znaleziono zdjęcia (np. strona renderowana przez SPA/JS)
      shouldTryTier2 = true;
    }

    // 3. Tier 2: ZenRows Fallback (headless browser + residential proxy)
    if (shouldTryTier2 && process.env.ZENROWS_API_KEY) {
      const tier2Html = await fetchWithZenRows(productUrl, { timeoutMs: 25000 });
      if (tier2Html) {
        const metadata = extractProductMetadata(tier2Html, productUrl);
        if (metadata && metadata.imageUrl) {
          return metadata;
        }
      }
    }

    // 4. Błąd całkowity – nie udało się pobrać zdjęcia z żadnego źródła
    returnServerError(
      "Nie udało się automatycznie pobrać zdjęcia z podanego linku. Możesz wkleić link do zdjęcia ręcznie."
    );
  });
