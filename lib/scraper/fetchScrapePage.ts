import dns from "node:dns";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { validateResolvedIpSafety } from "@/lib/scraper/ssrfProtection";

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

  const timeoutSignal = AbortSignal.timeout(5000);
  const signal = parentSignal
    ? AbortSignal.any([parentSignal, timeoutSignal])
    : timeoutSignal;
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
        isIP(address) !== family || !validateResolvedIpSafety(address, family),
    )
  ) {
    throw new ScrapeSecurityError("Unsafe scraping address");
  }

  const lookup: LookupFunction = (hostname, options, callback) => {
    if (hostname !== targetUrl.hostname) {
      callback(new ScrapeSecurityError("Unexpected scraping hostname"), "", 4);
      return;
    }
    if (options.all) {
      callback(null, addresses);
    } else {
      callback(null, firstAddress.address, firstAddress.family);
    }
  };

  return new Promise((resolve, reject) => {
    const request = https.get(
      targetUrl,
      { headers, lookup, agent: false, signal },
      (response) => {
        const status = response.statusCode ?? 0;
        response.on("error", reject);
        if (status >= 300 && status < 400) {
          response.destroy();
          reject(new ScrapeSecurityError("Scraping redirects are not allowed"));
          return;
        }
        if (status < 200 || status >= 300) {
          response.destroy();
          resolve({ status, html: "" });
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          resolve({ status, html: Buffer.concat(chunks).toString("utf8") });
        });
      },
    );
    request.on("error", reject);
  });
}
