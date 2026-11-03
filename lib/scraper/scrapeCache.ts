import { abuseStore, type OperationLease } from "@/lib/abuse/store";
import { hashAbuseKey } from "@/lib/abuse/clientIdentity";
import { AbuseLimitError, ABUSE_MESSAGES } from "@/lib/abuse/errors";
import {
  scrapedMetadataResultSchema,
  type ScrapedMetadataResult,
} from "@/schemas/productScrape";

export const SCRAPE_CAPACITY = 4;
export const SCRAPE_LEASE_SECONDS = 120;
export const SCRAPE_DEADLINE_MS = 75000;

async function acquireScrapeSlot(): Promise<OperationLease> {
  for (let slotIndex = 0; slotIndex < SCRAPE_CAPACITY; slotIndex++) {
    const lease = await abuseStore.acquireLease(
      `scrape:slot:${slotIndex}`,
      SCRAPE_LEASE_SECONDS,
    );
    if (lease) return lease;
  }
  throw new AbuseLimitError(5, ABUSE_MESSAGES.scrapeBusy);
}

export function getScrapeCacheKey(productUrl: string, shopId: string): string {
  const normalizedUrl = new URL(productUrl);
  normalizedUrl.hash = "";
  return hashAbuseKey(`${shopId}:${normalizedUrl.href}`);
}

export async function withScrapeCache(
  productUrl: string,
  shopId: string,
  scrape: (signal: AbortSignal) => Promise<ScrapedMetadataResult | null>,
): Promise<ScrapedMetadataResult | null> {
  const signal = AbortSignal.timeout(SCRAPE_DEADLINE_MS);
  const cacheKey = getScrapeCacheKey(productUrl, shopId);
  const cached = await abuseStore.readScrapeCache(cacheKey);
  if (cached)
    return scrapedMetadataResultSchema.nullable().parse(cached.payload);

  const urlLease = await abuseStore.acquireLease(
    `scrape:url:${cacheKey}`,
    SCRAPE_LEASE_SECONDS,
  );
  if (!urlLease) throw new AbuseLimitError(3, ABUSE_MESSAGES.scrapeBusy);
  let slotLease: OperationLease | undefined;

  try {
    const completed = await abuseStore.readScrapeCache(cacheKey);
    if (completed)
      return scrapedMetadataResultSchema.nullable().parse(completed.payload);

    slotLease = await acquireScrapeSlot();
    signal.throwIfAborted();
    const result = await scrape(signal);
    signal.throwIfAborted();
    const validatedResult = scrapedMetadataResultSchema
      .nullable()
      .parse(result);
    await abuseStore.writeScrapeCache(
      cacheKey,
      JSON.stringify(validatedResult),
      validatedResult ? 900 : 60,
      urlLease,
    );
    return validatedResult;
  } finally {
    await Promise.all([
      abuseStore.releaseLease(urlLease),
      ...(slotLease ? [abuseStore.releaseLease(slotLease)] : []),
    ]);
  }
}
