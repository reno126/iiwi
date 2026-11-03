"use server";

import {
  productScrapeSchema,
  scrapedMetadataResultSchema,
  PRODUCT_SCRAPE_MESSAGES,
} from "@/schemas/productScrape";
import { validateUrlSafetyAsync } from "@/lib/scraper/ssrfProtection";
import { scrapeProductMetadata } from "@/lib/scraper/productScrapeService";
import { findScrapingShop } from "@/lib/scraper/findScrapingShop";
import { publicActionClient } from "@/lib/actions/safeActionClient";
import { returnServerError } from "next-safe-action";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/helper";
import { enforceRequestLimits, enforceScrapeQuota } from "@/lib/abuse/limits";

export const productScrapeMetadata = publicActionClient
  .inputSchema(productScrapeSchema)
  .outputSchema(scrapedMetadataResultSchema)
  .action(async ({ parsedInput }) => {
    const { productUrl } = parsedInput;

    const clientIdentity = await enforceRequestLimits(
      "scrape",
      await headers(),
    );
    const session = await auth();
    await enforceScrapeQuota(clientIdentity, session?.user?.id);

    const safetyCheck = await validateUrlSafetyAsync(productUrl);
    if (!safetyCheck.isValid) {
      return returnServerError(
        safetyCheck.error ?? PRODUCT_SCRAPE_MESSAGES.defaultSecurityError,
      );
    }

    const matchedShop = await findScrapingShop(productUrl);
    if (!matchedShop) {
      return returnServerError(PRODUCT_SCRAPE_MESSAGES.unsupportedShopError);
    }

    const scrapedResult = await scrapeProductMetadata(productUrl, matchedShop);
    if (!scrapedResult) {
      return returnServerError(PRODUCT_SCRAPE_MESSAGES.scrapeFailedError);
    }

    return scrapedResult;
  });
