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

    console.log(`[Scraper] Starting Tier 1 direct fetch for: ${productUrl}`);
    const tier1Start = Date.now();

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
      const tier1Duration = Date.now() - tier1Start;

      console.log(
        `[Scraper] Tier 1 responded with HTTP ${response.status} in ${tier1Duration}ms for: ${productUrl}`
      );

      if (response.ok) {
        tier1Html = await response.text();
      } else if (response.status === 403 || response.status === 503 || response.status === 429) {
        console.log(
          `[Scraper] Tier 1 received blocking status (${response.status}). Flagging for Tier 2 fallback.`
        );
        shouldTryTier2 = true;
      }
    } catch (err) {
      const tier1Duration = Date.now() - tier1Start;
      console.log(
        `[Scraper] Tier 1 network error/timeout after ${tier1Duration}ms:`,
        err instanceof Error ? err.message : err
      );
      // Błąd sieci lub timeout w Tier 1 – kwalifikuje do próby Tier 2
      shouldTryTier2 = true;
    }

    // Próba ekstrakcji z HTML uzyskanego w Tier 1
    if (tier1Html) {
      console.log(
        `[Scraper] Tier 1 returned HTML (${tier1Html.length} chars). Attempting metadata extraction...`
      );
      const metadata = extractProductMetadata(tier1Html, productUrl);
      if (metadata && metadata.imageUrl) {
        console.log(`[Scraper] Tier 1 extraction success:`, metadata);
        return metadata;
      }
      console.log(
        `[Scraper] Tier 1 HTML did not yield a valid product image. Flagging for Tier 2 fallback.`
      );
      // Jeśli Tier 1 zwrócił HTML, ale nie znaleziono zdjęcia (np. strona renderowana przez SPA/JS)
      shouldTryTier2 = true;
    }

    // 3. Tier 2: ZenRows Fallback (headless browser + residential proxy)
    if (shouldTryTier2 && process.env.ZENROWS_API_KEY) {
      console.log(`[Scraper] Starting Tier 2 (ZenRows) fallback for: ${productUrl}`);
      const tier2Html = await fetchWithZenRows(productUrl, { timeoutMs: 25000 });
      if (tier2Html) {
        console.log(
          `[Scraper] ZenRows returned HTML (${tier2Html.length} chars). Attempting metadata extraction...`
        );
        const metadata = extractProductMetadata(tier2Html, productUrl);
        if (metadata && metadata.imageUrl) {
          console.log(`[Scraper] Tier 2 extraction success:`, metadata);
          return metadata;
        }
        console.warn(
          `[Scraper] Tier 2 extraction failed: ZenRows returned 200 OK HTML, but extractProductMetadata found no valid imageUrl for: ${productUrl}`
        );
      } else {
        console.warn(`[Scraper] Tier 2 (ZenRows) returned null or empty response for: ${productUrl}`);
      }
    } else if (shouldTryTier2 && !process.env.ZENROWS_API_KEY) {
      console.warn(`[Scraper] Tier 2 needed, but ZENROWS_API_KEY is not configured.`);
    }

    // 4. Błąd całkowity – nie udało się pobrać zdjęcia z żadnego źródła
    console.warn(`[Scraper] Scrape fully failed for: ${productUrl}`);
    returnServerError(
      "Nie udało się automatycznie pobrać zdjęcia z podanego linku. Możesz wkleić link do zdjęcia ręcznie."
    );
  });
