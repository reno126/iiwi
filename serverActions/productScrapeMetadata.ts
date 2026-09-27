"use server";

import {
  productScrapeSchema,
  scrapedMetadataResultSchema,
  PRODUCT_SCRAPE_MESSAGES,
} from "@/schemas/productScrape";
import { validateUrlSafety } from "@/lib/scraper/ssrfProtection";
import { scrapeProductMetadata } from "@/lib/scraper/productScrapeService";
import { findShopByUrl } from "@/lib/shops/findShopByUrl";
import { publicActionClient } from "@/lib/actions/safeActionClient";
import { returnServerError } from "next-safe-action";

export const productScrapeMetadata = publicActionClient
  .inputSchema(productScrapeSchema)
  .outputSchema(scrapedMetadataResultSchema)
  .action(async ({ parsedInput }) => {
    const { productUrl } = parsedInput;

    const safetyCheck = validateUrlSafety(productUrl);
    if (!safetyCheck.isValid) {
      return returnServerError(
        safetyCheck.error ?? PRODUCT_SCRAPE_MESSAGES.defaultSecurityError,
      );
    }

    const matchedShop = await findShopByUrl(productUrl);
    if (!matchedShop) {
      return returnServerError(PRODUCT_SCRAPE_MESSAGES.unsupportedShopError);
    }

    const scrapedResult = await scrapeProductMetadata(productUrl, matchedShop);
    if (!scrapedResult) {
      return returnServerError(PRODUCT_SCRAPE_MESSAGES.scrapeFailedError);
    }

    return scrapedResult;
  });
