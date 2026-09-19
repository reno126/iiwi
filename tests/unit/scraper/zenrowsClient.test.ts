import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithZenRows } from "@/lib/scraper/zenrowsClient";

describe("lib/scraper/zenrowsClient", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("returns null immediately when ZENROWS_API_KEY is not configured", async () => {
    delete process.env.ZENROWS_API_KEY;
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const result = await fetchWithZenRows("https://example.com/product");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when ZENROWS_API_KEY is empty or only whitespace", async () => {
    process.env.ZENROWS_API_KEY = "   ";
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const result = await fetchWithZenRows("https://example.com/product");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls ZenRows endpoint with default query parameters and returns html on success", async () => {
    process.env.ZENROWS_API_KEY = "test-zenrows-api-key";

    const mockHtml =
      "<html><head><title>Produkt Testowy</title></head><body>Treść</body></html>";
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: {
        get: vi.fn((header: string) => {
          if (header === "zr-status") return "200";
          if (header === "content-type") return "text/html";
          return null;
        }),
      },
      text: async () => mockHtml,
    });
    globalThis.fetch = fetchMock;

    const result = await fetchWithZenRows("https://sklep.pl/p/1");

    expect(result).toBe(mockHtml);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl] = fetchMock.mock.calls[0];
    const urlObj = new URL(calledUrl);

    expect(urlObj.origin).toBe("https://api.zenrows.com");
    expect(urlObj.pathname).toBe("/v1/");
    expect(urlObj.searchParams.get("apikey")).toBe("test-zenrows-api-key");
    expect(urlObj.searchParams.get("url")).toBe("https://sklep.pl/p/1");
    expect(urlObj.searchParams.get("js_render")).toBe("true");
    expect(urlObj.searchParams.get("premium_proxy")).toBe("true");
    expect(urlObj.searchParams.get("antibot")).toBe("true");
    expect(urlObj.searchParams.get("proxy_country")).toBe("pl");
  });

  it("passes custom options (antibot, proxyCountry, waitMs, waitFor) to the URL", async () => {
    process.env.ZENROWS_API_KEY = "test-key";

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => "<html></html>",
    });
    globalThis.fetch = fetchMock;

    await fetchWithZenRows("https://sklep.pl/p/2", {
      antibot: false,
      proxyCountry: "de",
      waitMs: 1500,
      waitFor: ".product-loaded",
    });

    const [calledUrl] = fetchMock.mock.calls[0];
    const urlObj = new URL(calledUrl);

    expect(urlObj.searchParams.get("antibot")).toBeNull();
    expect(urlObj.searchParams.get("proxy_country")).toBe("de");
    expect(urlObj.searchParams.get("wait")).toBe("1500");
    expect(urlObj.searchParams.get("wait_for")).toBe(".product-loaded");
  });

  it("returns null when API returns an HTTP error status", async () => {
    process.env.ZENROWS_API_KEY = "test-key";

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      headers: { get: () => null },
    });
    globalThis.fetch = fetchMock;

    const result = await fetchWithZenRows("https://protected-shop.com");

    expect(result).toBeNull();
  });

  it("handles AbortError timeout gracefully and returns null", async () => {
    process.env.ZENROWS_API_KEY = "test-key";

    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";

    const fetchMock = vi.fn().mockRejectedValueOnce(abortError);
    globalThis.fetch = fetchMock;

    const result = await fetchWithZenRows("https://timeout-shop.com", {
      timeoutMs: 100,
    });

    expect(result).toBeNull();
  });

  it("handles generic network errors gracefully and returns null", async () => {
    process.env.ZENROWS_API_KEY = "test-key";

    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED"));
    globalThis.fetch = fetchMock;

    const result = await fetchWithZenRows("https://down-shop.com");

    expect(result).toBeNull();
  });
});
