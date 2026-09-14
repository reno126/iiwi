"use server";

import { productScrapeSchema } from "@/schemas/productScrape";
import { validateUrlSafety } from "@/lib/scraper/ssrfProtection";
import { extractProductMetadata } from "@/lib/scraper/extractMetadata";
import { fetchWithZenRows } from "@/lib/scraper/zenrowsClient";
import {
  findShopByUrl,
  type MatchedShopResult,
} from "@/lib/shops/findShopByUrl";
import { createSafeActionClient, returnServerError } from "next-safe-action";

export interface ScrapedMetadataResult {
  imageUrl?: string | null;
  name?: string | null;
  code?: string | null;
  shop?: MatchedShopResult | null;
  scrapedFields: Array<"name" | "imageUrl" | "code" | "shop">;
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
  "Sec-Ch-Ua":
    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

export const productScrapeMetadata = createSafeActionClient({
  defaultValidationErrorsShape: "flattened",
})
  .inputSchema(productScrapeSchema)
  .action(async ({ parsedInput }) => {
    const { productUrl } = parsedInput;

    // 1. Ochrona SSRF (Server-Side Request Forgery)
    const safetyCheck = validateUrlSafety(productUrl);
    if (!safetyCheck.isValid) {
      returnServerError(
        safetyCheck.error ??
          "Podany adres URL jest niedozwolony ze względów bezpieczeństwa.",
      );
    }

    // 2. Tier 1: Szybki bezpośredni fetch z nagłówkami przeglądarki (timeout 5s)
    let tier1Html: string | null = null;
    let tier1Metadata: ReturnType<typeof extractProductMetadata> = null;
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
        `[Scraper] Tier 1 responded with HTTP ${response.status} in ${tier1Duration}ms for: ${productUrl}`,
      );

      if (response.ok) {
        tier1Html = await response.text();
      } else if (
        response.status === 403 ||
        response.status === 503 ||
        response.status === 429
      ) {
        console.log(
          `[Scraper] Tier 1 received blocking status (${response.status}). Flagging for Tier 2 fallback.`,
        );
        shouldTryTier2 = true;
      }
    } catch (err) {
      const tier1Duration = Date.now() - tier1Start;
      console.log(
        `[Scraper] Tier 1 network error/timeout after ${tier1Duration}ms:`,
        err instanceof Error ? err.message : err,
      );
      // Błąd sieci lub timeout w Tier 1 – kwalifikuje do próby Tier 2
      shouldTryTier2 = true;
    }

    // Próba ekstrakcji z HTML uzyskanego w Tier 1
    if (tier1Html) {
      console.log(
        `[Scraper] Tier 1 returned HTML (${tier1Html.length} chars). Attempting metadata extraction...`,
      );
      tier1Metadata = extractProductMetadata(tier1Html, productUrl);

      // Jeśli Tier 1 pozyskał zarówno zdjęcie, jak i nazwę – mamy pełny sukces
      if (tier1Metadata && tier1Metadata.imageUrl && tier1Metadata.name) {
        console.log(`[Scraper] Tier 1 full extraction success:`, tier1Metadata);
        const shop = await findShopByUrl(productUrl);
        const scrapedFields: Array<"name" | "imageUrl" | "code" | "shop"> = [];
        if (tier1Metadata.name) scrapedFields.push("name");
        if (tier1Metadata.imageUrl) scrapedFields.push("imageUrl");
        if (tier1Metadata.code) scrapedFields.push("code");
        if (shop) scrapedFields.push("shop");

        return {
          ...tier1Metadata,
          shop,
          scrapedFields,
        };
      }

      // Jeżeli brak zdjęcia (często renderowanego przez JS), ale jest ZenRows – spróbujmy Tier 2
      if (!tier1Metadata?.imageUrl) {
        console.log(
          `[Scraper] Tier 1 HTML is missing product image. Flagging for Tier 2 fallback.`,
        );
        shouldTryTier2 = true;
      }
    }

    // 3. Tier 2: ZenRows Fallback (headless browser + residential proxy)
    let tier2Metadata: ReturnType<typeof extractProductMetadata> = null;
    if (shouldTryTier2 && process.env.ZENROWS_API_KEY) {
      console.log(
        `[Scraper] Starting Tier 2 (ZenRows) fallback for: ${productUrl}`,
      );
      const tier2Html = await fetchWithZenRows(productUrl, {
        timeoutMs: 60000,
      });
      if (tier2Html) {
        console.log(
          `[Scraper] ZenRows returned HTML (${tier2Html.length} chars). Attempting metadata extraction...`,
        );
        tier2Metadata = extractProductMetadata(tier2Html, productUrl);
        if (tier2Metadata) {
          console.log(`[Scraper] Tier 2 extraction returned:`, tier2Metadata);
        }
      } else {
        console.warn(
          `[Scraper] Tier 2 (ZenRows) returned null or empty response for: ${productUrl}`,
        );
      }
    } else if (shouldTryTier2 && !process.env.ZENROWS_API_KEY) {
      console.warn(
        `[Scraper] Tier 2 needed, but ZENROWS_API_KEY is not configured.`,
      );
    }

    // Scalanie wyników z Tier 1 i Tier 2 (preferując wartości niepuste)
    const mergedMetadata = {
      imageUrl: tier2Metadata?.imageUrl || tier1Metadata?.imageUrl || null,
      name: tier2Metadata?.name || tier1Metadata?.name || null,
      code: tier2Metadata?.code || tier1Metadata?.code || null,
    };

    const shop = await findShopByUrl(productUrl);

    const hasAnyData = Boolean(
      mergedMetadata.imageUrl ||
        mergedMetadata.name ||
        mergedMetadata.code ||
        shop,
    );

    if (hasAnyData) {
      const scrapedFields: Array<"name" | "imageUrl" | "code" | "shop"> = [];
      if (mergedMetadata.name) scrapedFields.push("name");
      if (mergedMetadata.imageUrl) scrapedFields.push("imageUrl");
      if (mergedMetadata.code) scrapedFields.push("code");
      if (shop) scrapedFields.push("shop");

      console.log(`[Scraper] Scrape succeeded with partial or full metadata:`, {
        ...mergedMetadata,
        shop,
        scrapedFields,
      });

      return {
        ...mergedMetadata,
        shop,
        scrapedFields,
      };
    }

    // 4. Błąd całkowity – nie udało się pobrać żadnych metadanych
    console.warn(`[Scraper] Scrape fully failed for: ${productUrl}`);
    returnServerError(
      "Nie udało się automatycznie pobrać danych z podanego linku. Możesz uzupełnić dane ręcznie.",
    );
  });
