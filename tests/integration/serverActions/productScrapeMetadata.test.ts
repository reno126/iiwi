import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth helper before importing server action
vi.mock("@/lib/auth/helper", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/shops/findShopByUrl", () => ({
  findShopByUrl: vi.fn().mockResolvedValue(null),
}));

import { auth } from "@/lib/auth/helper";
import { findShopByUrl } from "@/lib/shops/findShopByUrl";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";

describe("serverActions/productScrapeMetadata", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, ZENROWS_API_KEY: "test-zenrows-key" };
    // Domyślnie symulujemy zalogowanego użytkownika
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-test-1", email: "tester@example.com" },
      expires: "9999-12-31",
    });
  });

  it("blocks SSRF attack attempts and returns a server error", async () => {
    const result = await productScrapeMetadata({
      productUrl: "http://169.254.169.254/latest/meta-data",
    });

    expect(result?.data).toBeUndefined();
    expect(result?.serverError).toBeDefined();
    expect(result?.serverError).toContain("prywatny lub zastrzeżony adres IP");
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
      })
    );

    const result = await productScrapeMetadata({
      productUrl: "https://shop.pl/p/12345/headphones",
    });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data).toEqual({
      imageUrl: "https://cdn.shop.pl/items/headphones.jpg",
      name: "Słuchawki Bezprzewodowe Sony",
      code: "12345",
      shop: null,
    });

    // Upewnijmy się, że Tier 2 (ZenRows) nie był wywołany
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://shop.pl/p/12345/headphones");
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
      // 1. Pierwsze wywołanie: Tier 1 (403 Forbidden - Cloudflare Turnstile)
      .mockResolvedValueOnce(
        new Response("Forbidden: Cloudflare Challenge", { status: 403 })
      )
      // 2. Drugie wywołanie: Tier 2 (ZenRows API 200 OK)
      .mockResolvedValueOnce(
        new Response(tier2Html, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        })
      );

    const result = await productScrapeMetadata({
      productUrl: "https://www.action.com/pl-pl/p/3222380/ladowarka-scienna-usb-c-sologic/",
    });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data).toEqual({
      imageUrl: "https://action.scene7.com/is/image/Action/3222380_1",
      name: "Ładowarka ścienna USB-C Sologic",
      code: "3222380",
      shop: null,
    });

    // Powinny być dokładnie 2 zapytania: Tier 1 i fallback Tier 2
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const zenrowsCallUrl = String(fetchSpy.mock.calls[1][0]);
    expect(zenrowsCallUrl).toContain("api.zenrows.com");
    expect(zenrowsCallUrl).toContain("js_render=true");
    expect(zenrowsCallUrl).toContain("premium_proxy=true");
  });

  it("enriches metadata with matched shop when findShopByUrl finds a shop", async () => {
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
      })
    );

    const mockShop = {
      id: "shop-me",
      name: "Media Expert",
      logo: "https://example.com/me.svg",
    };
    vi.mocked(findShopByUrl).mockResolvedValueOnce(mockShop);

    const result = await productScrapeMetadata({
      productUrl: "https://www.mediaexpert.pl/hulajnogi/item-123",
    });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data).toEqual({
      imageUrl: "https://mediaexpert.pl/img/item.jpg",
      name: "Hulajnoga elektryczna",
      code: null,
      shop: mockShop,
    });
  });

  it("returns a graceful server error when both Tier 1 and Tier 2 fail to extract image", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("Access Denied", { status: 403 }))
      .mockResolvedValueOnce(
        new Response("<html><body>No image here</body></html>", { status: 200 })
      );

    const result = await productScrapeMetadata({
      productUrl: "https://difficult-shop.com/item",
    });

    expect(result?.data).toBeUndefined();
    expect(result?.serverError).toBeDefined();
    expect(result?.serverError).toContain("Nie udało się automatycznie pobrać zdjęcia");
  });
});
