import { describe, it, expect, vi, beforeEach } from "vitest";
import dns from "node:dns";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/abuse/limits", () => ({
  enforceRequestLimits: vi.fn().mockResolvedValue("test-client"),
  enforceScrapeQuota: vi.fn(),
  reservePaidScrape: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/scraper/scrapeCache", () => ({
  withScrapeCache: vi.fn(
    async (
      productUrl: string,
      shopId: string,
      scrape: (signal: AbortSignal) => Promise<unknown>,
    ) => scrape(new AbortController().signal),
  ),
}));

vi.mock("node:dns", () => ({
  default: {
    promises: {
      lookup: vi
        .fn()
        .mockResolvedValue([{ address: "93.184.216.34", family: 4 }]),
    },
  },
}));

vi.mock("@/lib/auth/helper", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/scraper/findScrapingShop", () => ({
  findScrapingShop: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/scraper/fetchScrapePage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/scraper/fetchScrapePage")>()),
  fetchScrapePage: vi.fn(async (url: string) => {
    const response = await fetch(url);
    return { status: response.status, html: await response.text() };
  }),
}));

import { auth } from "@/lib/auth/helper";
import { findScrapingShop } from "@/lib/scraper/findScrapingShop";
import {
  fetchScrapePage,
  ScrapeSecurityError,
} from "@/lib/scraper/fetchScrapePage";
import { SSRF_ERRORS } from "@/lib/scraper/ssrfProtection";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import { PRODUCT_SCRAPE_MESSAGES } from "@/schemas/productScrape";
import { enforceRequestLimits, enforceScrapeQuota } from "@/lib/abuse/limits";
import { AbuseLimitError, ABUSE_MESSAGES } from "@/lib/abuse/errors";

describe("serverActions/productScrapeMetadata", () => {
  const originalEnv = process.env;
  const defaultMockShop = {
    id: "shop-default-1",
    name: "Sklep Testowy",
    logo: "https://shop.pl/logo.svg",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, ZENROWS_API_KEY: "test-zenrows-key" };
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-test-1", email: "tester@example.com" },
      expires: "9999-12-31",
    });
    vi.mocked(findScrapingShop).mockResolvedValue(defaultMockShop);
  });

  it.each([enforceRequestLimits, enforceScrapeQuota])(
    "rejects exhausted limits before DNS or provider requests",
    async (limitCheck) => {
      vi.mocked(limitCheck).mockRejectedValueOnce(new AbuseLimitError(60));
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const result = await productScrapeMetadata({
        productUrl: "https://shop.pl/product",
      });

      expect(result?.serverError).toBe(ABUSE_MESSAGES.rateLimited);
      expect(dns.promises.lookup).not.toHaveBeenCalled();
      expect(fetchScrapePage).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("assigns a guest quota without requiring login", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);
    vi.mocked(findScrapingShop).mockResolvedValueOnce(null);
    await productScrapeMetadata({ productUrl: "https://shop.pl/product" });

    expect(enforceScrapeQuota).toHaveBeenCalledWith("test-client", undefined);
  });

  it("assigns the quota to the server authenticated account", async () => {
    vi.mocked(findScrapingShop).mockResolvedValueOnce(null);
    await productScrapeMetadata({ productUrl: "https://shop.pl/product" });

    expect(enforceScrapeQuota).toHaveBeenCalledWith(
      "test-client",
      "user-test-1",
    );
  });

  it("blocks SSRF attack attempts and returns a server error", async () => {
    const result = await productScrapeMetadata({
      productUrl: "https://169.254.169.254/latest/meta-data",
    });

    expect(result?.data).toBeUndefined();
    expect(result?.serverError).toBe(SSRF_ERRORS.privateOrReservedIPv4);
  });

  it("blocks scraping and returns an error when shop domain is not recognized", async () => {
    vi.mocked(findScrapingShop).mockResolvedValueOnce(null);

    const result = await productScrapeMetadata({
      productUrl: "https://unknown-shop.com/item/123",
    });

    expect(result?.data).toBeUndefined();
    expect(result?.serverError).toBe(
      PRODUCT_SCRAPE_MESSAGES.unsupportedShopError,
    );
    expect(fetchScrapePage).not.toHaveBeenCalled();
  });

  it("successfully extracts metadata in Tier 1 when direct fetch returns 200", async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:image" content="https://cdn.shop.pl/items/headphones.jpg" />
          <meta property="og:title" content="Słuchawki Bezprzewodowe Sony - Sklep" />
        </head>
        <body>
          <h1>Słuchawki Bezprzewodowe Sony</h1>
        </body>
      </html>
    `;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(mockHtml, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );

    const result = await productScrapeMetadata({
      productUrl: "https://shop.pl/p/12345/headphones",
    });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data).toEqual({
      imageUrl: "https://cdn.shop.pl/items/headphones.jpg",
      name: "Słuchawki Bezprzewodowe Sony",
      code: "12345",
      shop: defaultMockShop,
      scrapedFields: ["name", "imageUrl", "code", "shop"],
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(
      "https://shop.pl/p/12345/headphones",
    );
  });

  it("falls back to Tier 2 (ZenRows) when Tier 1 is blocked by Cloudflare (403)", async () => {
    const tier2Html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:image" content="https://action.scene7.com/is/image/Action/3222380_1" />
          <meta property="og:title" content="Ładowarka ścienna USB-C Sologic" />
        </head>
        <body>
          <h1>Ładowarka ścienna USB-C Sologic</h1>
        </body>
      </html>
    `;

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response("Forbidden: Cloudflare Challenge", { status: 403 }),
      )
      .mockResolvedValueOnce(
        new Response(tier2Html, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      );

    const result = await productScrapeMetadata({
      productUrl:
        "https://www.action.com/pl-pl/p/3222380/ladowarka-scienna-usb-c-sologic/",
    });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data).toEqual({
      imageUrl: "https://action.scene7.com/is/image/Action/3222380_1",
      name: "Ładowarka ścienna USB-C Sologic",
      code: "3222380",
      shop: defaultMockShop,
      scrapedFields: ["name", "imageUrl", "code", "shop"],
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const zenrowsCallUrl = String(fetchSpy.mock.calls[1]?.[0]);
    expect(zenrowsCallUrl).toContain("api.zenrows.com");
    expect(zenrowsCallUrl).toContain("js_render=true");
    expect(zenrowsCallUrl).toContain("premium_proxy=true");
  });

  it("enriches metadata with the shop authorized for scraping", async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:image" content="https://mediaexpert.pl/img/item.jpg" />
          <meta property="og:title" content="Hulajnoga elektryczna" />
        </head>
        <body>
          <h1>Hulajnoga elektryczna</h1>
        </body>
      </html>
    `;

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(mockHtml, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );

    const mockShop = {
      id: "shop-me",
      name: "Media Expert",
      logo: "https://example.com/me.svg",
    };
    vi.mocked(findScrapingShop).mockResolvedValueOnce(mockShop);

    const result = await productScrapeMetadata({
      productUrl: "https://www.mediaexpert.pl/hulajnogi/item-123",
    });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data).toEqual({
      imageUrl: "https://mediaexpert.pl/img/item.jpg",
      name: "Hulajnoga elektryczna",
      code: null,
      shop: mockShop,
      scrapedFields: ["name", "imageUrl", "shop"],
    });
  });

  it("succeeds with partial metadata when only name is present (no image)", async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Myszka bezprzewodowa</title>
        </head>
        <body>
          <h1>Myszka bezprzewodowa</h1>
        </body>
      </html>
    `;

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(mockHtml, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      );

    const result = await productScrapeMetadata({
      productUrl: "https://sklep.pl/myszka",
    });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data).toEqual({
      imageUrl: null,
      name: "Myszka bezprzewodowa",
      code: null,
      shop: defaultMockShop,
      scrapedFields: ["name", "shop"],
    });
  });

  it("returns a graceful server error when both Tier 1 and Tier 2 fail to extract any metadata", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("Access Denied", { status: 403 }))
      .mockResolvedValueOnce(
        new Response("<html><body><div>Pusto</div></body></html>", {
          status: 200,
        }),
      );

    const result = await productScrapeMetadata({
      productUrl: "https://difficult-shop.com/item",
    });

    expect(result?.data).toBeUndefined();
    expect(result?.serverError).toBe(PRODUCT_SCRAPE_MESSAGES.scrapeFailedError);
  });

  it("blocks DNS rebinding attacks when domain resolves to private IP", async () => {
    vi.mocked(dns.promises.lookup).mockResolvedValueOnce([
      { address: "192.168.1.1", family: 4 },
    ] as never);

    const result = await productScrapeMetadata({
      productUrl: "https://shop.pl/malicious-item",
    });

    expect(result?.data).toBeUndefined();
    expect(result?.serverError).toBe(SSRF_ERRORS.dnsRebindingPrivateIp);
  });

  it("does not invoke the paid provider after a transport security rejection", async () => {
    vi.mocked(fetchScrapePage).mockRejectedValueOnce(
      new ScrapeSecurityError("Unsafe destination"),
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await productScrapeMetadata({
      productUrl: "https://shop.pl/redirect",
    });

    expect(result?.serverError).toBe(PRODUCT_SCRAPE_MESSAGES.scrapeFailedError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
