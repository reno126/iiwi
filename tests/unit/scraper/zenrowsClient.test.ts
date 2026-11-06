import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithZenRows } from "@/lib/scraper/zenrowsClient";
import { reservePaidScrape } from "@/lib/abuse/limits";
import { MAX_SCRAPE_HTML_BYTES } from "@/lib/scraper/readScrapeHtml";
import { writeFile } from "node:fs/promises";

vi.mock("fs", () => ({ existsSync: () => true, writeFileSync: vi.fn() }));

vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/abuse/limits", () => ({
  reservePaidScrape: vi.fn().mockResolvedValue(true),
}));

describe("lib/scraper/zenrowsClient", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("does not contact the provider after the shared paid budget is exhausted", async () => {
    process.env.ZENROWS_API_KEY = "test-key";
    vi.mocked(reservePaidScrape).mockResolvedValueOnce(false);
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    expect(await fetchWithZenRows("https://shop.pl/product")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed before contacting the provider when budget storage is unavailable", async () => {
    process.env.ZENROWS_API_KEY = "test-key";
    vi.mocked(reservePaidScrape).mockRejectedValueOnce(
      new Error("Database unavailable"),
    );
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    await expect(fetchWithZenRows("https://shop.pl/product")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
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
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(mockHtml, {
        headers: { "content-type": "text/html", "zr-status": "200" },
      }),
    );
    globalThis.fetch = fetchMock;

    const result = await fetchWithZenRows("https://sklep.pl/p/1");

    expect(result).toBe(mockHtml);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    const urlObj = new URL(calledUrl);

    expect(urlObj.origin).toBe("https://api.zenrows.com");
    expect(urlObj.pathname).toBe("/v1/");
    expect(urlObj.searchParams.get("apikey")).toBeNull();
    expect(urlObj.searchParams.get("url")).toBe("https://sklep.pl/p/1");
    expect(urlObj.searchParams.get("js_render")).toBe("true");
    expect(urlObj.searchParams.get("premium_proxy")).toBe("true");
    expect(urlObj.searchParams.get("antibot")).toBe("true");
    expect(urlObj.searchParams.get("proxy_country")).toBe("pl");

    const calledOptions = fetchMock.mock.calls[0]?.[1];
    expect(calledOptions?.headers).toEqual({
      "X-API-Key": "test-zenrows-api-key",
    });
  });

  it("passes custom options (antibot, proxyCountry, waitMs, waitFor) to the URL", async () => {
    process.env.ZENROWS_API_KEY = "test-key";

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response("<html></html>", {
        headers: { "content-type": "text/html" },
      }),
    );
    globalThis.fetch = fetchMock;

    await fetchWithZenRows("https://sklep.pl/p/2", {
      antibot: false,
      proxyCountry: "de",
      waitMs: 1500,
      waitFor: ".product-loaded",
    });

    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    const urlObj = new URL(calledUrl);

    expect(urlObj.searchParams.get("antibot")).toBeNull();
    expect(urlObj.searchParams.get("proxy_country")).toBe("de");
    expect(urlObj.searchParams.get("wait")).toBe("1500");
    expect(urlObj.searchParams.get("wait_for")).toBe(".product-loaded");
  });

  it.each([
    '<html lang="pl"><head><title>Product</title></head></html>',
    "<!DOCTYPE html>\n<html><head><title>Product</title></head></html>",
  ])("accepts an HTML document mislabeled as text/plain: %s", async (html) => {
    process.env.ZENROWS_API_KEY = "test-key";
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(html, {
        headers: { "content-type": "text/plain; charset=utf-8" },
      }),
    );

    expect(await fetchWithZenRows("https://shop.pl/item")).toBe(html);
  });

  it.each(['{"error":"<html>blocked</html>"}', "Provider unavailable", ""])(
    "rejects non-HTML plain text: %s",
    async (body) => {
      process.env.ZENROWS_API_KEY = "test-key";
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(body, {
          headers: { "content-type": "text/plain" },
        }),
      );

      expect(await fetchWithZenRows("https://shop.pl/item")).toBeNull();
    },
  );

  it("keeps the byte limit for mislabeled plain-text HTML", async () => {
    process.env.ZENROWS_API_KEY = "test-key";
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response("<html>" + "x".repeat(MAX_SCRAPE_HTML_BYTES), {
        headers: { "content-type": "text/plain" },
      }),
    );

    expect(await fetchWithZenRows("https://shop.pl/item")).toBeNull();
  });

  it("returns null when API returns an HTTP error status", async () => {
    process.env.ZENROWS_API_KEY = "test-key";

    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({ cancel });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(body, { status: 403 }));
    globalThis.fetch = fetchMock;

    const result = await fetchWithZenRows("https://protected-shop.com");

    expect(result).toBeNull();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it.each(["application/json", "image/png", ""])(
    "cancels unsupported response bodies: %s",
    async (contentType) => {
      process.env.ZENROWS_API_KEY = "test-key";
      const cancel = vi.fn();
      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(new ReadableStream<Uint8Array>({ cancel }), {
          headers: contentType ? { "content-type": contentType } : {},
        }),
      );

      expect(await fetchWithZenRows("https://shop.pl/item")).toBeNull();
      expect(cancel).toHaveBeenCalledOnce();
    },
  );

  it("cancels oversized streaming HTML even with an understated content length", async () => {
    process.env.ZENROWS_API_KEY = "test-key";
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_SCRAPE_HTML_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel,
    });
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(body, {
        headers: { "content-type": "text/html", "content-length": "1" },
      }),
    );

    expect(await fetchWithZenRows("https://shop.pl/item")).toBeNull();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("saves rejected response diagnostics before rejecting a non-HTML body in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.ZENROWS_API_KEY = "test-key";
    const responseBody = JSON.stringify({
      error: "Provider rejected the target",
    });
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(responseBody, {
        headers: { "content-type": "application/json", "zr-status": "403" },
      }),
    );

    expect(await fetchWithZenRows("https://shop.pl/item")).toBeNull();
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("shop.pl_last_zenrows_response.txt"),
      responseBody,
      "utf8",
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining("shop.pl_last_zenrows_response.json"),
      expect.stringContaining('"content-type": "application/json"'),
      "utf8",
    );
  });

  it.each(["timeout", "parent cancellation"])(
    "cancels a body stalled after headers on %s",
    async (abortSource) => {
      vi.useFakeTimers();
      process.env.ZENROWS_API_KEY = "test-key";
      const controller = new AbortController();
      const cancel = vi.fn();
      const body = new ReadableStream<Uint8Array>({
        start(streamController) {
          streamController.enqueue(new TextEncoder().encode("<html>"));
        },
        cancel,
      });
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(body, { headers: { "content-type": "text/html" } }),
        );

      const result = fetchWithZenRows("https://shop.pl/item", {
        timeoutMs: 100,
        signal: controller.signal,
      });
      await vi.advanceTimersByTimeAsync(99);
      expect(cancel).not.toHaveBeenCalled();
      if (abortSource === "timeout") await vi.advanceTimersByTimeAsync(1);
      else controller.abort();

      expect(await result).toBeNull();
      expect(cancel).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    },
  );

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
