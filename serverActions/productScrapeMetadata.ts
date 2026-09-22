"use server";

import {
  productScrapeSchema,
  scrapedMetadataResultSchema,
  type ScrapedMetadataResult,
  PRODUCT_SCRAPE_MESSAGES,
} from "@/schemas/productScrape";
import { validateUrlSafety } from "@/lib/scraper/ssrfProtection";
import { scrapeProductMetadata } from "@/lib/scraper/productScrapeService";
import { publicActionClient } from "@/lib/actions/safeActionClient";
import { returnServerError } from "next-safe-action";

export type { ScrapedMetadataResult };

export const productScrapeMetadata = publicActionClient
  .inputSchema(productScrapeSchema)
  .outputSchema(scrapedMetadataResultSchema)
  .action(async ({ parsedInput }) => {
    const { productUrl } = parsedInput;

    const safetyCheck = validateUrlSafety(productUrl);
    if (!safetyCheck.isValid) {
      returnServerError(
        safetyCheck.error ?? PRODUCT_SCRAPE_MESSAGES.defaultSecurityError,
      );
    }

    const scrapedResult = await scrapeProductMetadata(productUrl);
    if (!scrapedResult) {
      returnServerError(PRODUCT_SCRAPE_MESSAGES.scrapeFailedError);
    }

    return scrapedResult;
  });
