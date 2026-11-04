import dns from "node:dns";
import https from "node:https";
import { Readable } from "node:stream";
import { isIP, type LookupFunction } from "node:net";
import { validateResolvedIpSafety } from "@/lib/scraper/ssrfProtection";
import { readScrapeHtml } from "@/lib/scraper/readScrapeHtml";

export class ScrapeSecurityError extends Error {}

export interface ScrapePageResponse {
  status: number;
  html: string;
}

export async function fetchScrapePage(
  productUrl: string,
  headers: Record<string, string>,
  parentSignal?: AbortSignal,
): Promise<ScrapePageResponse> {
  const targetUrl = new URL(productUrl);
  if (
    targetUrl.protocol !== "https:" ||
    targetUrl.port ||
    targetUrl.username ||
    targetUrl.password ||
    isIP(targetUrl.hostname) ||
    targetUrl.hostname.includes(":")
  ) {
    throw new ScrapeSecurityError("Invalid scraping destination");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  const signal = parentSignal
    ? AbortSignal.any([parentSignal, controller.signal])
    : controller.signal;
  try {
    signal.throwIfAborted();
    const addresses = await dns.promises.lookup(targetUrl.hostname, {
      all: true,
    });
    signal.throwIfAborted();
    const firstAddress = addresses[0];
    if (
      !firstAddress ||
      addresses.some(
        ({ address, family }) =>
          isIP(address) !== family ||
          !validateResolvedIpSafety(address, family),
      )
    ) {
      throw new ScrapeSecurityError("Unsafe scraping address");
    }

    const lookup: LookupFunction = (hostname, options, callback) => {
      if (hostname !== targetUrl.hostname) {
        callback(
          new ScrapeSecurityError("Unexpected scraping hostname"),
          "",
          4,
        );
        return;
      }
      if (options.all) {
        callback(null, addresses);
      } else {
        callback(null, firstAddress.address, firstAddress.family);
      }
    };

    return await new Promise((resolve, reject) => {
      const request = https.get(
        targetUrl,
        { headers, lookup, agent: false, signal },
        (response) => {
          const status = response.statusCode ?? 0;
          response.on("error", reject);
          if (status >= 300 && status < 400) {
            response.destroy();
            reject(
              new ScrapeSecurityError("Scraping redirects are not allowed"),
            );
            return;
          }
          if (status < 200 || status >= 300) {
            response.destroy();
            resolve({ status, html: "" });
            return;
          }

          void readScrapeHtml(
            Readable.toWeb(response, {
              strategy: {
                highWaterMark: response.readableHighWaterMark,
                size: (chunk: Uint8Array) => chunk.byteLength,
              },
            }),
            response.headers["content-type"] ?? null,
            signal,
          ).then((html) => resolve({ status, html }), reject);
        },
      );
      request.on("error", reject);
    });
  } finally {
    clearTimeout(timer);
  }
}
