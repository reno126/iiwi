import { extractProductMetadata } from "@/lib/scraper/extractMetadata";
import { fetchWithZenRows } from "@/lib/scraper/zenrowsClient";
import {
  findShopByUrl,
  type MatchedShopResult,
} from "@/lib/shops/findShopByUrl";
import type { ScrapedMetadataResult } from "@/schemas/productScrape";

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

interface MergedScrapedMetadata {
  imageUrl: string | null;
  name: string | null;
  code: string | null;
}

interface Tier1FetchOutcome {
  html: string | null;
  shouldTryTier2: boolean;
}

function mergeScrapedMetadata(
  tier1Metadata: ReturnType<typeof extractProductMetadata>,
  tier2Metadata: ReturnType<typeof extractProductMetadata>,
): MergedScrapedMetadata {
  return {
    imageUrl: tier2Metadata?.imageUrl || tier1Metadata?.imageUrl || null,
    name: tier2Metadata?.name || tier1Metadata?.name || null,
    code: tier2Metadata?.code || tier1Metadata?.code || null,
  };
}

function buildScrapedFieldsList(
  metadata: {
    imageUrl?: string | null;
    name?: string | null;
    code?: string | null;
  },
  shop?: MatchedShopResult | null,
): Array<"name" | "imageUrl" | "code" | "shop"> {
  const fields: Array<"name" | "imageUrl" | "code" | "shop"> = [];
  if (metadata.name) fields.push("name");
  if (metadata.imageUrl) fields.push("imageUrl");
  if (metadata.code) fields.push("code");
  if (shop) fields.push("shop");
  return fields;
}

async function fetchDirectTier1(
  productUrl: string,
): Promise<Tier1FetchOutcome> {
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
      const html = await response.text();
      return { html, shouldTryTier2: false };
    }

    if (
      response.status === 403 ||
      response.status === 503 ||
      response.status === 429
    ) {
      console.log(
        `[Scraper] Tier 1 received blocking status (${response.status}). Flagging for Tier 2 fallback.`,
      );
      return { html: null, shouldTryTier2: true };
    }

    return { html: null, shouldTryTier2: false };
  } catch (error) {
    const tier1Duration = Date.now() - tier1Start;
    console.log(
      `[Scraper] Tier 1 network error/timeout after ${tier1Duration}ms:`,
      error instanceof Error ? error.message : error,
    );
    return { html: null, shouldTryTier2: true };
  }
}

export async function scrapeProductMetadata(
  productUrl: string,
): Promise<ScrapedMetadataResult | null> {
  const { html: tier1Html, shouldTryTier2: initialTier2Flag } =
    await fetchDirectTier1(productUrl);

  let tier1Metadata: ReturnType<typeof extractProductMetadata> = null;
  let shouldTryTier2 = initialTier2Flag;

  if (tier1Html) {
    console.log(
      `[Scraper] Tier 1 returned HTML (${tier1Html.length} chars). Attempting metadata extraction...`,
    );
    tier1Metadata = extractProductMetadata(tier1Html, productUrl);

    const isTier1Complete = Boolean(
      tier1Metadata?.imageUrl && tier1Metadata?.name,
    );
    if (tier1Metadata && isTier1Complete) {
      console.log(`[Scraper] Tier 1 full extraction success:`, tier1Metadata);
      const matchedShop = await findShopByUrl(productUrl);
      const scrapedFields = buildScrapedFieldsList(tier1Metadata, matchedShop);

      return {
        ...tier1Metadata,
        shop: matchedShop,
        scrapedFields,
      };
    }

    if (!tier1Metadata?.imageUrl) {
      console.log(
        `[Scraper] Tier 1 HTML is missing product image. Flagging for Tier 2 fallback.`,
      );
      shouldTryTier2 = true;
    }
  }

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

  const mergedMetadata = mergeScrapedMetadata(tier1Metadata, tier2Metadata);
  const matchedShop = await findShopByUrl(productUrl);

  const hasAnyData = Boolean(
    mergedMetadata.imageUrl ||
      mergedMetadata.name ||
      mergedMetadata.code ||
      matchedShop,
  );

  if (hasAnyData) {
    const scrapedFields = buildScrapedFieldsList(mergedMetadata, matchedShop);

    console.log(`[Scraper] Scrape succeeded with partial or full metadata:`, {
      ...mergedMetadata,
      shop: matchedShop,
      scrapedFields,
    });

    return {
      ...mergedMetadata,
      shop: matchedShop,
      scrapedFields,
    };
  }

  console.warn(`[Scraper] Scrape fully failed for: ${productUrl}`);
  return null;
}
