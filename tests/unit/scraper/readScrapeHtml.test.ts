import { describe, expect, it, vi } from "vitest";
import {
  MAX_SCRAPE_HTML_BYTES,
  readScrapeHtml,
} from "@/lib/scraper/readScrapeHtml";

describe("scraping HTML reader", () => {
  it("finishes cancellation even when the underlying source never acknowledges it", async () => {
    const cancel = vi.fn(() => new Promise<void>(() => undefined));
    const body = new ReadableStream<Uint8Array>({ cancel });
    const controller = new AbortController();
    const result = readScrapeHtml(body, "text/html", controller.signal);
    controller.abort();

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });

  it.each(["text/html; charset=utf-8", "Application/XHTML+XML"])(
    "decodes UTF-8 split across chunks for %s",
    async (contentType) => {
      const html = "<html>Żółć 😀</html>";
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const byte of new TextEncoder().encode(html)) {
            controller.enqueue(new Uint8Array([byte]));
          }
          controller.close();
        },
      });

      expect(
        await readScrapeHtml(body, contentType, new AbortController().signal),
      ).toBe(html);
    },
  );

  it("accepts exactly the byte limit", async () => {
    const html = "x".repeat(MAX_SCRAPE_HTML_BYTES);
    const response = new Response(html);
    expect(
      await readScrapeHtml(
        response.body,
        "text/html",
        new AbortController().signal,
      ),
    ).toBe(html);
  });

  it("cancels an already-aborted body without reading it", async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({ cancel });
    const controller = new AbortController();
    controller.abort();

    await expect(
      readScrapeHtml(body, "text/html", controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });
});
