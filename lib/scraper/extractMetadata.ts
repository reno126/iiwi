import * as cheerio from "cheerio";

export interface ScrapedProductMetadata {
  imageUrl?: string | null;
  name?: string | null;
  code?: string | null;
}

function normalizeUrl(
  rawUrl: string | undefined | null,
  baseUrl: string,
): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  let cleaned = rawUrl.trim();
  if (!cleaned) return null;

  if (cleaned.startsWith("//")) {
    cleaned = `https:${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned, baseUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function isTechnicalOrPlaceholderKeyword(urlLower: string): boolean {
  const technicalKeywords = [
    "favicon",
    "logo",
    "banner",
    "icon",
    "spinner",
    "placeholder",
    "pixel",
    "track",
    "badge",
    "1x1",
  ];

  return technicalKeywords.some((keyword) => urlLower.includes(keyword));
}

function isValidProductImage(url: string): boolean {
  const lower = url.toLowerCase();

  const isVectorOrDataUri =
    lower.endsWith(".svg") ||
    lower.includes(".svg?") ||
    lower.startsWith("data:");
  if (isVectorOrDataUri) {
    return false;
  }

  return !isTechnicalOrPlaceholderKeyword(lower);
}

function cleanProductName(name: string | undefined | null): string | null {
  if (!name || typeof name !== "string") return null;

  let cleaned = name.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  cleaned = cleaned.replace(/\s*\|\s*[^|]+$/i, "");
  cleaned = cleaned.replace(/\s+[-–—]\s+[^–—-]+$/i, "");
  cleaned = cleaned.replace(/\s+w\s+[A-Za-z0-9\s.]+$/i, "");

  cleaned = cleaned.trim();
  if (!cleaned) return null;

  return cleaned.slice(0, 100);
}

function cleanProductCode(
  code: string | number | undefined | null,
): string | null {
  if (code === undefined || code === null) return null;

  const str = String(code).trim();
  if (!str) return null;

  return str.slice(0, 24);
}

interface JsonLdProductData {
  imageUrl?: string | null;
  name?: string | null;
  code?: string | null;
}

function isProductJsonLdType(type: unknown): boolean {
  if (type === "Product") return true;
  if (Array.isArray(type) && type.includes("Product")) return true;
  if (typeof type === "string" && type.toLowerCase() === "product") return true;
  return false;
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findProductInJsonLd(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProductInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  if (!isRecordObject(node)) {
    return null;
  }

  if (isProductJsonLdType(node["@type"])) {
    return node;
  }

  if (Array.isArray(node["@graph"])) {
    for (const item of node["@graph"]) {
      const found = findProductInJsonLd(item);
      if (found) return found;
    }
  }

  return null;
}

function extractImageUrlFromJsonLdNode(
  productNode: Record<string, unknown>,
  baseUrl: string,
): string | null {
  if (!productNode.image) return null;

  const img = productNode.image;
  let candidate: string | null = null;

  if (typeof img === "string") {
    candidate = img;
  } else if (Array.isArray(img) && img.length > 0) {
    const first = img[0];
    if (typeof first === "string") {
      candidate = first;
    } else if (isRecordObject(first)) {
      const rawUrl = first.url ?? first.contentUrl;
      if (typeof rawUrl === "string") {
        candidate = rawUrl;
      }
    }
  } else if (isRecordObject(img)) {
    const rawUrl = img.url ?? img.contentUrl;
    if (typeof rawUrl === "string") {
      candidate = rawUrl;
    }
  }

  if (candidate) {
    const normalized = normalizeUrl(candidate, baseUrl);
    if (normalized && isValidProductImage(normalized)) {
      return normalized;
    }
  }

  return null;
}

function extractProductCodeFromJsonLdNode(
  productNode: Record<string, unknown>,
): string | null {
  const codeCandidates = [
    productNode.gtin13,
    productNode.gtin,
    productNode.gtin8,
    productNode.gtin12,
    productNode.gtin14,
    productNode.sku,
    productNode.mpn,
    productNode.productID,
  ];

  for (const cand of codeCandidates) {
    if (typeof cand === "string" || typeof cand === "number") {
      const cleaned = cleanProductCode(cand);
      if (cleaned) {
        return cleaned;
      }
    }
  }

  return null;
}

function extractFromJsonLd(
  $: cheerio.CheerioAPI,
  baseUrl: string,
): JsonLdProductData {
  const result: JsonLdProductData = {};

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const content = $(element).text().trim();
      if (!content) return;

      const parsedJson = JSON.parse(content);
      const productNode = findProductInJsonLd(parsedJson);

      if (productNode) {
        if (!result.imageUrl) {
          result.imageUrl = extractImageUrlFromJsonLdNode(productNode, baseUrl);
        }

        if (!result.name && typeof productNode.name === "string") {
          result.name = cleanProductName(productNode.name);
        }

        if (!result.code) {
          result.code = extractProductCodeFromJsonLdNode(productNode);
        }
      }
    } catch {
      return;
    }
  });

  return result;
}

function extractCodeFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;

    const pMatch = pathname.match(/\/p\/([0-9A-Za-z_-]{3,24})(?:\/|$)/);
    if (pMatch?.[1]) {
      return cleanProductCode(pMatch[1]);
    }

    const idMatch = pathname.match(
      /\/(?:id|kod|produkt)-([0-9A-Za-z_-]{3,24})(?:\/|$|\.html)/i,
    );
    if (idMatch?.[1]) {
      return cleanProductCode(idMatch[1]);
    }
  } catch {
    return null;
  }
  return null;
}

function parseSrcset(srcsetValue: string | undefined | null): string[] {
  if (!srcsetValue || typeof srcsetValue !== "string") return [];

  const candidates: string[] = [];
  const entries = srcsetValue.split(",");

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const urlPart = trimmed.split(/\s+/)[0];
    if (urlPart) {
      candidates.push(urlPart);
    }
  }

  return candidates.reverse();
}

function extractElementImageCandidates(
  $: cheerio.CheerioAPI,
  elem: Parameters<cheerio.CheerioAPI>[0],
): string[] {
  const $el = $(elem);
  const candidates: (string | undefined)[] = [];

  candidates.push($el.attr("data-zoom-bg"));
  candidates.push($el.attr("data-zoom-image"));
  candidates.push($el.attr("data-large"));
  candidates.push($el.attr("data-high-res-src"));

  const parentZoomBg = $el.closest("[data-zoom-bg]").attr("data-zoom-bg");
  if (parentZoomBg) candidates.push(parentZoomBg);

  const parentZoomImg = $el
    .closest("[data-zoom-image]")
    .attr("data-zoom-image");
  if (parentZoomImg) candidates.push(parentZoomImg);

  const dataSrcsetCandidates = parseSrcset($el.attr("data-srcset"));
  candidates.push(...dataSrcsetCandidates);

  const srcsetCandidates = parseSrcset($el.attr("srcset"));
  candidates.push(...srcsetCandidates);

  candidates.push($el.attr("data-src"));
  candidates.push($el.attr("data-original"));
  candidates.push($el.attr("src"));
  candidates.push($el.attr("content"));
  candidates.push($el.attr("href"));

  const $parentPicture = $el.parent("picture");
  if ($parentPicture.length > 0) {
    $parentPicture.find("source").each((_, source) => {
      const $source = $(source);
      candidates.push(...parseSrcset($source.attr("data-srcset")));
      candidates.push(...parseSrcset($source.attr("srcset")));
      candidates.push($source.attr("src"));
    });
  }

  return candidates.filter((c): c is string =>
    Boolean(c && typeof c === "string" && c.trim().length > 0),
  );
}

function extractOpenGraphImageUrl(
  $: cheerio.CheerioAPI,
  pageUrl: string,
): string | null {
  const ogImage =
    $('meta[property="og:image:secure_url"]').attr("content") ||
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $('meta[property="twitter:image"]').attr("content");

  if (ogImage) {
    const normalized = normalizeUrl(ogImage, pageUrl);
    if (normalized && isValidProductImage(normalized)) {
      return normalized;
    }
  }

  return null;
}

function extractMicrodataImageUrl(
  $: cheerio.CheerioAPI,
  pageUrl: string,
): string | null {
  const itempropElems = $('[itemprop="image"]').toArray();
  for (const elem of itempropElems) {
    const candidates = extractElementImageCandidates($, elem);
    for (const cand of candidates) {
      const normalized = normalizeUrl(cand, pageUrl);
      if (normalized && isValidProductImage(normalized)) {
        return normalized;
      }
    }
  }
  return null;
}

function extractDomHeuristicImageUrl(
  $: cheerio.CheerioAPI,
  pageUrl: string,
): string | null {
  const domSelectors = [
    "[data-zoom-bg]",
    "[data-zoom-image]",
    '[data-testid*="product-image"] img',
    "[data-gallery] img",
    ".carousel-product img",
    ".carousel-product [data-zoom-bg]",
    ".product-image img",
    ".product-gallery img",
    ".product__media img",
    ".product-media img",
    ".pdp-image img, .pdp-main-image img",
    ".product-detail img, .product-details img",
    ".swiper-slide.carousel-product__item img",
    "picture img",
    "main picture img",
    "article img",
  ];

  for (const selector of domSelectors) {
    const elements = $(selector).toArray();
    for (const elem of elements) {
      const candidates = extractElementImageCandidates($, elem);
      for (const cand of candidates) {
        const normalized = normalizeUrl(cand, pageUrl);
        if (normalized && isValidProductImage(normalized)) {
          return normalized;
        }
      }
    }
  }

  return null;
}

function extractProductImageUrl(
  $: cheerio.CheerioAPI,
  pageUrl: string,
  jsonLdData: JsonLdProductData,
): string | null {
  const openGraphImage = extractOpenGraphImageUrl($, pageUrl);
  if (openGraphImage) {
    return openGraphImage;
  }

  if (jsonLdData.imageUrl) {
    return jsonLdData.imageUrl;
  }

  const microdataImage = extractMicrodataImageUrl($, pageUrl);
  if (microdataImage) {
    return microdataImage;
  }

  return extractDomHeuristicImageUrl($, pageUrl);
}

function extractProductNameFromHeadings($: cheerio.CheerioAPI): string | null {
  const h1Text = $(
    "main h1, article h1, h1, .product-name, .product-title, .pdp-title",
  )
    .first()
    .text();
  return cleanProductName(h1Text);
}

function extractProductNameFromMicrodata($: cheerio.CheerioAPI): string | null {
  const productScopeName = $(
    '[itemscope][itemtype*="Product"] [itemprop="name"]',
  )
    .first()
    .text();
  if (productScopeName) {
    return cleanProductName(productScopeName);
  }

  const allItempropNames = $('[itemprop="name"]').toArray();
  if (allItempropNames.length > 0) {
    const lastItempropName = $(
      allItempropNames[allItempropNames.length - 1],
    ).text();
    return cleanProductName(lastItempropName);
  }

  return null;
}

function extractProductNameFromMetaTags($: cheerio.CheerioAPI): string | null {
  const metaTitle =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content");
  return cleanProductName(metaTitle);
}

function extractProductName(
  $: cheerio.CheerioAPI,
  jsonLdData: JsonLdProductData,
): string | null {
  if (jsonLdData.name) {
    return jsonLdData.name;
  }

  const headingName = extractProductNameFromHeadings($);
  if (headingName) {
    return headingName;
  }

  const microdataName = extractProductNameFromMicrodata($);
  if (microdataName) {
    return microdataName;
  }

  const metaName = extractProductNameFromMetaTags($);
  if (metaName) {
    return metaName;
  }

  const pageTitle = $("title").first().text();
  return cleanProductName(pageTitle);
}

function extractProductCodeFromMicrodata($: cheerio.CheerioAPI): string | null {
  const itempropCode = $(
    '[itemprop="gtin13"], [itemprop="gtin"], [itemprop="sku"], [itemprop="mpn"], [itemprop="productID"]',
  ).first();
  const rawVal = itempropCode.attr("content") || itempropCode.text();
  return cleanProductCode(rawVal);
}

function extractProductCodeFromTableSpecification(
  $: cheerio.CheerioAPI,
): string | null {
  const labelPatterns =
    /EAN|Kod produktu|Symbol|Numer artykułu|SKU|Kod producenta/i;
  let detectedCode: string | null = null;

  $("table tr, dl, .specifications tr, .product-attributes li, li").each(
    (_, row) => {
      if (detectedCode) return;

      const rowText = $(row).text();
      if (labelPatterns.test(rowText)) {
        const valueEl = $(row).find("td:last-child, dd").first();
        const valueText =
          valueEl.length > 0
            ? valueEl.text()
            : rowText.replace(labelPatterns, "");
        const cand = valueText.replace(/[:]/g, "").trim();
        if (cand && cand.length <= 24 && /^[A-Za-z0-9_-]+$/.test(cand)) {
          detectedCode = cleanProductCode(cand);
        }
      }
    },
  );

  return detectedCode;
}

function extractProductCode(
  $: cheerio.CheerioAPI,
  pageUrl: string,
  jsonLdData: JsonLdProductData,
): string | null {
  if (jsonLdData.code) {
    return jsonLdData.code;
  }

  const microdataCode = extractProductCodeFromMicrodata($);
  if (microdataCode) {
    return microdataCode;
  }

  const tableCode = extractProductCodeFromTableSpecification($);
  if (tableCode) {
    return tableCode;
  }

  return extractCodeFromUrl(pageUrl);
}

export function extractProductMetadata(
  html: string,
  pageUrl: string,
): ScrapedProductMetadata | null {
  if (!html || !html.trim()) return null;

  const $ = cheerio.load(html);
  const jsonLdData = extractFromJsonLd($, pageUrl);

  const imageUrl = extractProductImageUrl($, pageUrl, jsonLdData);
  const name = extractProductName($, jsonLdData);
  const code = extractProductCode($, pageUrl, jsonLdData);

  const hasAnyData = Boolean(imageUrl || name || code);
  if (!hasAnyData) {
    return null;
  }

  return {
    imageUrl: imageUrl || null,
    name: name || null,
    code: code || null,
  };
}
