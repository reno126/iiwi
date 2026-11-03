import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createTestDatabase, database, controlPool } from "./helpers/database";

vi.mock("@/lib/db/prisma", async () => {
  const { database } = await import("./helpers/database");
  return { prisma: database };
});
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(), compare: vi.fn() } }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth/helper", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/scraper/productScrapeService", () => ({
  scrapeProductMetadata: vi.fn(),
}));
vi.mock("@/lib/scraper/ssrfProtection", () => ({
  validateUrlSafetyAsync: vi.fn(),
}));

import bcrypt from "bcryptjs";
import { createAbuseStore } from "@/lib/abuse/store";
import { getClientIdentity } from "@/lib/abuse/clientIdentity";
import { REQUEST_LIMITS } from "@/lib/abuse/limits";
import { AbuseLimitError, ABUSE_MESSAGES } from "@/lib/abuse/errors";
import {
  withScrapeCache,
  getScrapeCacheKey,
  SCRAPE_CAPACITY,
} from "@/lib/scraper/scrapeCache";
import { fetchWithZenRows } from "@/lib/scraper/zenrowsClient";
import { POST } from "@/app/api/register/route";
import type { ScrapedMetadataResult } from "@/schemas/productScrape";
import { headers } from "next/headers";
import { authOptions, AUTH_ERRORS } from "@/lib/auth/authOptions";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import { scrapeProductMetadata } from "@/lib/scraper/productScrapeService";
import { validateUrlSafetyAsync } from "@/lib/scraper/ssrfProtection";

const secondDatabase = createTestDatabase();
const firstInstance = createAbuseStore(database);
const secondInstance = createAbuseStore(secondDatabase);
const ownedBucketKeys = new Set<string>();
const ownedLeaseKeys = new Set<string>();
const ownedCacheKeys = new Set<string>();
let testKey: string;
let productUrl: string;
let cacheKey: string;
const metadata: ScrapedMetadataResult = {
  name: "Cached test product",
  scrapedFields: ["name"],
};

describe("PostgreSQL abuse controls across instances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testKey = `abuse-test:${randomUUID()}`;
    productUrl = `https://shop.example/${testKey}`;
    cacheKey = getScrapeCacheKey(productUrl, "test-shop");
    ownedBucketKeys.add(testKey);
    ownedLeaseKeys.add(testKey);
    ownedCacheKeys.add(cacheKey);
    ownedLeaseKeys.add(`scrape:url:${cacheKey}`);
    for (let slotIndex = 0; slotIndex < SCRAPE_CAPACITY; slotIndex++) {
      ownedLeaseKeys.add(`scrape:slot:${slotIndex}`);
    }
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    await database.abuseBucket.deleteMany({
      where: { key: { in: [...ownedBucketKeys] } },
    });
    await database.operationLease.deleteMany({
      where: { key: { in: [...ownedLeaseKeys] } },
    });
    await database.scrapeCache.deleteMany({
      where: { key: { in: [...ownedCacheKeys] } },
    });
    ownedBucketKeys.clear();
    ownedLeaseKeys.clear();
    ownedCacheKeys.clear();
  });

  afterAll(async () => {
    await Promise.all([
      database.$disconnect(),
      secondDatabase.$disconnect(),
      controlPool.end(),
    ]);
  });

  it("never exceeds a shared limit under concurrent requests from separate clients", async () => {
    const decisions = await Promise.all(
      Array.from({ length: 24 }, (_unusedValue, requestIndex) =>
        (requestIndex % 2 ? firstInstance : secondInstance).consume(
          testKey,
          5,
          60,
        ),
      ),
    );
    expect(decisions.filter((decision) => decision.allowed)).toHaveLength(5);
    expect(decisions.every((decision) => decision.retryAfterSeconds > 0)).toBe(
      true,
    );
  });

  it("resets expired quotas without retaining a permanent lockout", async () => {
    expect((await firstInstance.consume(testKey, 1, 60)).allowed).toBe(true);
    expect((await secondInstance.consume(testKey, 1, 60)).allowed).toBe(false);
    await database.abuseBucket.update({
      where: { key: testKey },
      data: { expiresAt: new Date(0) },
    });
    expect((await secondInstance.consume(testKey, 1, 60)).allowed).toBe(true);
  });

  it("does not erase consumed budget when the configured limit is reduced", async () => {
    await firstInstance.consume(testKey, 10, 60);
    await firstInstance.consume(testKey, 10, 60);
    await secondInstance.consume(testKey, 1, 60);
    expect((await firstInstance.consume(testKey, 2, 60)).allowed).toBe(false);
  });

  it("admits one lease owner and recovers an expired lease without letting the old owner release it", async () => {
    const attempts = await Promise.all(
      Array.from({ length: 12 }, (_unusedValue, requestIndex) =>
        (requestIndex % 2 ? firstInstance : secondInstance).acquireLease(
          testKey,
          120,
        ),
      ),
    );
    const winners = attempts.filter((lease) => lease !== null);
    expect(winners).toHaveLength(1);
    const originalLease = winners[0];
    if (!originalLease) throw new Error("Missing lease owner");
    await database.operationLease.update({
      where: { key: testKey },
      data: { expiresAt: new Date(0) },
    });
    const replacement = await secondInstance.acquireLease(testKey, 120);
    expect(replacement).not.toBeNull();
    await firstInstance.releaseLease(originalLease);
    expect(await firstInstance.acquireLease(testKey, 120)).toBeNull();
  });

  it("rejects a duplicate in-flight URL and serves its result from the shared cache afterwards", async () => {
    const started = Promise.withResolvers<void>();
    const finish = Promise.withResolvers<void>();
    const fetchMetadata = vi.fn(async () => {
      started.resolve();
      await finish.promise;
      return metadata;
    });
    const firstRequest = withScrapeCache(
      productUrl,
      "test-shop",
      fetchMetadata,
    );
    try {
      await Promise.race([started.promise, firstRequest]);
      await expect(
        withScrapeCache(`${productUrl}#details`, "test-shop", fetchMetadata),
      ).rejects.toBeInstanceOf(AbuseLimitError);
    } finally {
      finish.resolve();
      await firstRequest;
    }

    expect(await secondInstance.readScrapeCache(cacheKey)).toEqual({
      payload: metadata,
    });
    expect(
      await withScrapeCache(productUrl, "test-shop", fetchMetadata),
    ).toEqual(metadata);
    expect(fetchMetadata).toHaveBeenCalledTimes(1);
  });

  it("enforces the global scrape capacity held by another instance", async () => {
    for (let slotIndex = 0; slotIndex < SCRAPE_CAPACITY; slotIndex++) {
      expect(
        await secondInstance.acquireLease(`scrape:slot:${slotIndex}`, 120),
      ).not.toBeNull();
    }
    const fetchMetadata = vi.fn();
    await expect(
      withScrapeCache(productUrl, "test-shop", fetchMetadata),
    ).rejects.toBeInstanceOf(AbuseLimitError);
    expect(fetchMetadata).not.toHaveBeenCalled();
    expect(
      await database.operationLease.findUnique({
        where: { key: `scrape:url:${cacheKey}` },
      }),
    ).toBeNull();
  });

  it("caches failed extraction briefly and releases capacity after exceptions", async () => {
    const fetchMetadata = vi.fn().mockResolvedValue(null);
    expect(
      await withScrapeCache(productUrl, "test-shop", fetchMetadata),
    ).toBeNull();
    expect(
      await withScrapeCache(productUrl, "test-shop", fetchMetadata),
    ).toBeNull();
    expect(fetchMetadata).toHaveBeenCalledTimes(1);
    await database.scrapeCache.update({
      where: { key: cacheKey },
      data: { expiresAt: new Date(0) },
    });
    fetchMetadata.mockRejectedValueOnce(new Error("Network failed"));
    await expect(
      withScrapeCache(productUrl, "test-shop", fetchMetadata),
    ).rejects.toThrow("Network failed");
    expect(
      await database.operationLease.count({
        where: { key: { in: [...ownedLeaseKeys] } },
      }),
    ).toBe(0);
  });

  it("rejects registration before hashing after another instance consumes the client quota", async () => {
    vi.stubEnv("ABUSE_TRUSTED_IP_HEADER", "x-test-client-ip");
    const requestHeaders = new Headers({ "x-test-client-ip": "198.51.100.42" });
    const clientKey = `register:client:${getClientIdentity(requestHeaders)}`;
    ownedBucketKeys.add(clientKey);
    ownedBucketKeys.add("register:global");
    for (
      let attemptIndex = 0;
      attemptIndex < REQUEST_LIMITS.register.client;
      attemptIndex++
    ) {
      await secondInstance.consume(
        clientKey,
        REQUEST_LIMITS.register.client,
        REQUEST_LIMITS.register.windowSeconds,
      );
    }

    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        }),
      }),
    );
    expect(response.status).toBe(429);
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it("blocks paid provider requests after another instance consumes the budget", async () => {
    vi.stubEnv("ZENROWS_API_KEY", "test-key");
    vi.stubEnv("ZENROWS_DAILY_REQUEST_LIMIT", "1");
    ownedBucketKeys.add("zenrows:global");
    await secondInstance.consume("zenrows:global", 1, 86400);
    const fetchProvider = vi.spyOn(globalThis, "fetch");

    expect(await fetchWithZenRows(productUrl)).toBeNull();
    expect(fetchProvider).not.toHaveBeenCalled();
  });

  it("rejects login before bcrypt comparison after another instance consumes the client quota", async () => {
    vi.stubEnv("ABUSE_TRUSTED_IP_HEADER", "x-test-client-ip");
    const requestHeaders = { "x-test-client-ip": "198.51.100.43" };
    const clientKey = `login:client:${getClientIdentity(new Headers(requestHeaders))}`;
    ownedBucketKeys.add(clientKey);
    ownedBucketKeys.add("login:global");
    for (
      let attemptIndex = 0;
      attemptIndex < REQUEST_LIMITS.login.client;
      attemptIndex++
    ) {
      await secondInstance.consume(
        clientKey,
        REQUEST_LIMITS.login.client,
        REQUEST_LIMITS.login.windowSeconds,
      );
    }
    const provider = authOptions.providers.find(
      (configuredProvider) => configuredProvider.type === "credentials",
    );
    const configuration =
      provider && "options" in provider ? provider.options : undefined;
    if (
      !configuration ||
      typeof configuration !== "object" ||
      !("authorize" in configuration) ||
      typeof configuration.authorize !== "function"
    ) {
      throw new Error("Credentials provider has no authorize function");
    }

    await expect(
      configuration.authorize(
        { email: "test@example.com", password: "password123" },
        { headers: requestHeaders },
      ),
    ).rejects.toThrow(AUTH_ERRORS.rateLimited);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("rejects a scrape before DNS or either provider after another instance consumes the client quota", async () => {
    vi.stubEnv("ABUSE_TRUSTED_IP_HEADER", "x-test-client-ip");
    const requestHeaders = new Headers({ "x-test-client-ip": "198.51.100.44" });
    const clientKey = `scrape:client:${getClientIdentity(requestHeaders)}`;
    ownedBucketKeys.add(clientKey);
    ownedBucketKeys.add("scrape:global");
    vi.mocked(headers).mockResolvedValueOnce(requestHeaders);
    for (
      let attemptIndex = 0;
      attemptIndex < REQUEST_LIMITS.scrape.client;
      attemptIndex++
    ) {
      await secondInstance.consume(
        clientKey,
        REQUEST_LIMITS.scrape.client,
        REQUEST_LIMITS.scrape.windowSeconds,
      );
    }

    const result = await productScrapeMetadata({ productUrl });
    expect(result?.serverError).toBe(ABUSE_MESSAGES.rateLimited);
    expect(validateUrlSafetyAsync).not.toHaveBeenCalled();
    expect(scrapeProductMetadata).not.toHaveBeenCalled();
  });

  it("prevents expired owners from overwriting the shared cache", async () => {
    const originalLease = await firstInstance.acquireLease(testKey, 120);
    if (!originalLease) throw new Error("Missing original lease");
    await database.operationLease.update({
      where: { key: testKey },
      data: { expiresAt: new Date(0) },
    });
    const newLease = await secondInstance.acquireLease(testKey, 120);
    if (!newLease) throw new Error("Missing replacement lease");
    await secondInstance.writeScrapeCache(
      cacheKey,
      JSON.stringify(metadata),
      900,
      newLease,
    );
    await firstInstance.writeScrapeCache(
      cacheKey,
      JSON.stringify(null),
      900,
      originalLease,
    );

    expect(await firstInstance.readScrapeCache(cacheKey)).toEqual({
      payload: metadata,
    });
  });

  it("cleans expired state without deleting active counters or leases", async () => {
    await firstInstance.consume(testKey, 5, 60);
    const lease = await firstInstance.acquireLease(testKey, 120);
    if (!lease) throw new Error("Missing lease");
    await firstInstance.writeScrapeCache(
      cacheKey,
      JSON.stringify(metadata),
      900,
      lease,
    );
    await database.scrapeCache.update({
      where: { key: cacheKey },
      data: { expiresAt: new Date(0) },
    });

    await secondInstance.pruneExpired();
    expect(await firstInstance.readScrapeCache(cacheKey)).toBeUndefined();
    expect(
      await database.scrapeCache.findUnique({ where: { key: cacheKey } }),
    ).toBeNull();
    expect(
      await database.abuseBucket.findUnique({ where: { key: testKey } }),
    ).not.toBeNull();
    expect(await firstInstance.acquireLease(testKey, 120)).toBeNull();
  });
});
