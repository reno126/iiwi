import type { ReadableStream as NodeReadableStream } from "node:stream/web";

export const MAX_SCRAPE_HTML_BYTES = 2 * 1024 * 1024;

export class ScrapeResponseError extends Error {}

export async function readScrapeHtml(
  body: ReadableStream<Uint8Array> | NodeReadableStream<Uint8Array> | null,
  contentType: string | null,
  signal: AbortSignal,
): Promise<string> {
  const mediaType = contentType?.split(";")[0]?.trim().toLowerCase();
  if (mediaType !== "text/html" && mediaType !== "application/xhtml+xml") {
    void body?.cancel().catch(() => undefined);
    throw new ScrapeResponseError("Unsupported scraping content type");
  }
  if (!body) {
    signal.throwIfAborted();
    return "";
  }

  const reader = body.getReader();
  const cancelBody = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener("abort", cancelBody, { once: true });

  try {
    const bytes = new Uint8Array(MAX_SCRAPE_HTML_BYTES);
    let totalBytes = 0;
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      if (totalBytes + value.byteLength > MAX_SCRAPE_HTML_BYTES) {
        throw new ScrapeResponseError("Scraping response exceeds byte limit");
      }
      bytes.set(value, totalBytes);
      totalBytes += value.byteLength;
    }
    return new TextDecoder().decode(bytes.subarray(0, totalBytes));
  } catch (error) {
    cancelBody();
    throw error;
  } finally {
    signal.removeEventListener("abort", cancelBody);
    reader.releaseLock();
  }
}
