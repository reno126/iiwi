import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/abuse/store", () => ({
  abuseStore: { consume: vi.fn(), pruneExpired: vi.fn() },
}));

import { abuseStore } from "@/lib/abuse/store";
import {
  enforceAccountLimit,
  enforceRequestLimits,
  enforceScrapeQuota,
  reservePaidScrape,
  SCRAPE_QUOTAS,
} from "@/lib/abuse/limits";
import { AbuseLimitError } from "@/lib/abuse/errors";

describe("shared abuse policies", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(abuseStore.consume).mockResolvedValue({
      allowed: true,
      used: 2,
      retryAfterSeconds: 60,
    });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("stops at the global cap before creating client buckets", async () => {
    vi.mocked(abuseStore.consume).mockResolvedValueOnce({
      allowed: false,
      used: 301,
      retryAfterSeconds: 42,
    });
    await expect(
      enforceRequestLimits("scrape", new Headers()),
    ).rejects.toMatchObject({ retryAfterSeconds: 42 });
    expect(abuseStore.consume).toHaveBeenCalledTimes(1);
  });

  it("rejects a client after a successful global check", async () => {
    vi.mocked(abuseStore.consume)
      .mockResolvedValueOnce({ allowed: true, used: 2, retryAfterSeconds: 60 })
      .mockResolvedValueOnce({
        allowed: false,
        used: 21,
        retryAfterSeconds: 42,
      });
    await expect(
      enforceRequestLimits("scrape", new Headers()),
    ).rejects.toBeInstanceOf(AbuseLimitError);
  });

  it("gives guests a bounded allowance and accounts their own quota", async () => {
    await enforceScrapeQuota("client-one");
    await enforceScrapeQuota("client-one", "account-one");
    await enforceScrapeQuota("client-two", "account-one");

    expect(vi.mocked(abuseStore.consume).mock.calls[0]?.[1]).toBe(
      SCRAPE_QUOTAS.guest,
    );
    expect(vi.mocked(abuseStore.consume).mock.calls[1]?.[1]).toBe(
      SCRAPE_QUOTAS.account,
    );
    expect(vi.mocked(abuseStore.consume).mock.calls[1]?.[0]).toBe(
      vi.mocked(abuseStore.consume).mock.calls[2]?.[0],
    );
  });

  it("normalizes account identifiers only for quota accounting", async () => {
    await enforceAccountLimit("login", " Person@Example.com ");
    await enforceAccountLimit("login", "person@example.com");
    expect(vi.mocked(abuseStore.consume).mock.calls[0]).toEqual(
      vi.mocked(abuseStore.consume).mock.calls[1],
    );
  });

  it("supports disabling paid scraping without a storage call", async () => {
    vi.stubEnv("ZENROWS_DAILY_REQUEST_LIMIT", "0");
    expect(await reservePaidScrape()).toBe(false);
    expect(abuseStore.consume).not.toHaveBeenCalled();
  });

  it("reserves every paid attempt against one shared budget", async () => {
    vi.stubEnv("ZENROWS_DAILY_REQUEST_LIMIT", "12");
    expect(await reservePaidScrape()).toBe(true);
    expect(abuseStore.consume).toHaveBeenCalledWith(
      "zenrows:global",
      12,
      86400,
    );
  });

  it.each(["-1", "1.2", "NaN", "100001"])(
    "rejects invalid paid budget configuration: %s",
    async (limit) => {
      vi.stubEnv("ZENROWS_DAILY_REQUEST_LIMIT", limit);
      await expect(reservePaidScrape()).rejects.toThrow();
      expect(abuseStore.consume).not.toHaveBeenCalled();
    },
  );
});
