import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/abuse/store", () => ({
  abuseStore: {
    readScrapeCache: vi.fn(),
    acquireLease: vi.fn(),
    releaseLease: vi.fn(),
    writeScrapeCache: vi.fn(),
  },
}));

import { abuseStore } from "@/lib/abuse/store";
import { withScrapeCache, getScrapeCacheKey } from "@/lib/scraper/scrapeCache";
import type { ScrapedMetadataResult } from "@/schemas/productScrape";

describe("scrape cache deadlines and ownership", () => {
  const productUrl = "https://shop.example/product?variant=blue";
  const metadata: ScrapedMetadataResult = {
    name: "Product",
    scrapedFields: ["name"],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(abuseStore.readScrapeCache).mockResolvedValue(undefined);
    vi.mocked(abuseStore.acquireLease).mockImplementation(async (key) => ({
      key,
      token: "owner-token",
    }));
  });
  afterEach(() => vi.restoreAllMocks());

  it("does not start network work if the deadline passes while acquiring capacity", async () => {
    const controller = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    vi.mocked(abuseStore.acquireLease).mockImplementation(async (key) => {
      if (key.startsWith("scrape:slot:")) controller.abort();
      return { key, token: "owner-token" };
    });
    const scrape = vi.fn();

    await expect(withScrapeCache(productUrl, "shop", scrape)).rejects.toThrow();
    expect(scrape).not.toHaveBeenCalled();
    expect(abuseStore.writeScrapeCache).not.toHaveBeenCalled();
    expect(abuseStore.releaseLease).toHaveBeenCalledTimes(2);
  });

  it("does not cache results from work that finishes after its deadline", async () => {
    const controller = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    const scrape = vi.fn(async (signal: AbortSignal) => {
      expect(signal).toBe(controller.signal);
      controller.abort();
      return metadata;
    });

    await expect(withScrapeCache(productUrl, "shop", scrape)).rejects.toThrow();
    expect(abuseStore.writeScrapeCache).not.toHaveBeenCalled();
    expect(abuseStore.releaseLease).toHaveBeenCalledTimes(2);
  });

  it("rechecks the shared cache after acquiring URL ownership", async () => {
    vi.mocked(abuseStore.readScrapeCache)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ payload: metadata });
    const scrape = vi.fn();

    expect(await withScrapeCache(productUrl, "shop", scrape)).toEqual(metadata);
    expect(scrape).not.toHaveBeenCalled();
    expect(abuseStore.acquireLease).toHaveBeenCalledTimes(1);
    expect(abuseStore.releaseLease).toHaveBeenCalledTimes(1);
  });

  it("fails closed when the cache store is unavailable", async () => {
    vi.mocked(abuseStore.readScrapeCache).mockRejectedValueOnce(
      new Error("Database unavailable"),
    );
    const scrape = vi.fn();
    await expect(withScrapeCache(productUrl, "shop", scrape)).rejects.toThrow();
    expect(scrape).not.toHaveBeenCalled();
  });

  it("normalizes fragments while preserving product query parameters and shop identity", () => {
    const key = getScrapeCacheKey(productUrl, "shop");
    expect(getScrapeCacheKey(`${productUrl}#details`, "shop")).toBe(key);
    expect(
      getScrapeCacheKey(productUrl.replace("blue", "red"), "shop"),
    ).not.toBe(key);
    expect(getScrapeCacheKey(productUrl, "different-shop")).not.toBe(key);
  });
});
