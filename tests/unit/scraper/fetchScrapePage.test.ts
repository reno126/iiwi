import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";
import { IncomingMessage } from "node:http";
import { Socket } from "node:net";
import type { RequestOptions } from "node:https";

const { lookup, get } = vi.hoisted(() => ({
  lookup: vi.fn(),
  get: vi.fn<
    (
      url: URL,
      options: RequestOptions,
      onResponse: (response: IncomingMessage) => void,
    ) => EventEmitter
  >(),
}));
vi.mock("node:dns", () => ({ default: { promises: { lookup } } }));
vi.mock("node:https", () => ({ default: { get } }));

import {
  fetchScrapePage,
  ScrapeSecurityError,
} from "@/lib/scraper/fetchScrapePage";
import {
  MAX_SCRAPE_HTML_BYTES,
  ScrapeResponseError,
} from "@/lib/scraper/readScrapeHtml";

afterEach(() => vi.useRealTimers());

beforeEach(() => {
  lookup
    .mockReset()
    .mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  get.mockReset();
});

function respondWith(status: number, html = "", location?: string) {
  get.mockImplementation(
    (
      url: URL,
      options: RequestOptions,
      onResponse: (response: IncomingMessage) => void,
    ) => {
      const response = new IncomingMessage(new Socket());
      response.statusCode = status;
      response.headers["content-type"] = "text/html";
      if (location) response.headers.location = location;
      queueMicrotask(() => {
        onResponse(response);
        if (!response.destroyed) {
          response.push(Buffer.from(html));
          response.push(null);
        }
      });
      return new EventEmitter();
    },
  );
}

describe("scraper HTTPS transport", () => {
  it("cancels a stalled body when the five-second deadline expires", async () => {
    vi.useFakeTimers();
    const response = new IncomingMessage(new Socket());
    response.statusCode = 200;
    response.headers["content-type"] = "text/html";
    get.mockImplementation((targetUrl, options, onResponse) => {
      onResponse(response);
      response.push(Buffer.from("<html>"));
      return new EventEmitter();
    });

    const result = fetchScrapePage("https://shop.example/item", {});
    const assertion = expect(result).rejects.toMatchObject({
      name: "AbortError",
    });
    await vi.advanceTimersByTimeAsync(4999);
    expect(response.destroyed).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(response.destroyed).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["application/json", "image/png", undefined])(
    "cancels responses with an unsupported content type: %s",
    async (contentType) => {
      const response = new IncomingMessage(new Socket());
      response.statusCode = 200;
      response.headers["content-type"] = contentType;
      get.mockImplementation((targetUrl, options, onResponse) => {
        onResponse(response);
        return new EventEmitter();
      });

      await expect(
        fetchScrapePage("https://shop.example/item", {}),
      ).rejects.toBeInstanceOf(ScrapeResponseError);
      expect(response.destroyed).toBe(true);
    },
  );

  it("cancels a streamed response exceeding the byte limit", async () => {
    const response = new IncomingMessage(new Socket());
    response.statusCode = 200;
    response.headers["content-type"] = "text/html";
    response.headers["content-length"] = "10";
    get.mockImplementation((targetUrl, options, onResponse) => {
      onResponse(response);
      response.push(Buffer.alloc(MAX_SCRAPE_HTML_BYTES));
      response.push(Buffer.from("x"));
      return new EventEmitter();
    });

    await expect(
      fetchScrapePage("https://shop.example/item", {}),
    ).rejects.toBeInstanceOf(ScrapeResponseError);
    expect(response.destroyed).toBe(true);
  });

  it("pins the validated DNS result while preserving the TLS hostname", async () => {
    respondWith(200, "<h1>Product</h1>");
    lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);
    lookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);

    expect(await fetchScrapePage("https://shop.example/product", {})).toEqual({
      status: 200,
      html: "<h1>Product</h1>",
    });

    const requestCall = get.mock.calls[0];
    if (!requestCall) throw new Error("Expected an HTTPS request");
    const [targetUrl, options] = requestCall;
    expect(targetUrl.hostname).toBe("shop.example");
    expect(options.agent).toBe(false);
    expect(options.rejectUnauthorized).not.toBe(false);
    const callback = vi.fn();
    options.lookup?.("shop.example", { all: true }, callback);
    expect(callback).toHaveBeenCalledWith(null, [
      { address: "93.184.216.34", family: 4 },
    ]);
    options.lookup?.("shop.example", {}, callback);
    expect(callback).toHaveBeenLastCalledWith(null, "93.184.216.34", 4);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it.each([
    "http://127.0.0.1/private",
    "https://169.254.169.254/latest/meta-data",
    "https://attacker.example/item",
    "/another-product",
  ])(
    "rejects redirects without requesting their destination: %s",
    async (location) => {
      respondWith(302, "", location);
      await expect(
        fetchScrapePage("https://shop.example/item", {}),
      ).rejects.toBeInstanceOf(ScrapeSecurityError);
      expect(get).toHaveBeenCalledTimes(1);
      expect(lookup).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    [],
    [{ address: "127.0.0.1", family: 4 }],
    [{ address: "::ffff:127.0.0.1", family: 6 }],
    [{ address: "::ffff:7f00:1", family: 6 }],
    [{ address: "0000:0000:0000:0000:0000:ffff:a9fe:a9fe", family: 6 }],
    [
      { address: "93.184.216.34", family: 4 },
      { address: "192.168.1.1", family: 4 },
    ],
  ])(
    "rejects unsafe or empty DNS results before making a request: %j",
    async (...addresses) => {
      lookup.mockResolvedValue(addresses);
      await expect(
        fetchScrapePage("https://shop.example/item", {}),
      ).rejects.toBeInstanceOf(ScrapeSecurityError);
      expect(get).not.toHaveBeenCalled();
    },
  );
});
