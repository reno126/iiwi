import * as cheerio from "cheerio";

export interface ScrapedProductMetadata {
  imageUrl?: string | null;
  name?: string | null;
  code?: string | null;
}

/**
 * Normalizuje relatywne adresy URL do pełnego adresu bezwzględnego.
 */
function normalizeUrl(rawUrl: string | undefined | null, baseUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  let cleaned = rawUrl.trim();
  if (!cleaned) return null;

  // Obsługa adresów protocol-relative: //cdn.sklep.pl/obrazek.jpg
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

/**
 * Filtruje podejrzane adresy obrazków (ikony, svg, trackery, bannery).
 */
function isValidProductImage(url: string): boolean {
  const lower = url.toLowerCase();

  // Odrzucamy pliki SVG i data: URI
  if (lower.endsWith(".svg") || lower.includes(".svg?") || lower.startsWith("data:")) {
    return false;
  }

  // Odrzucamy typowe nazwy grafik technicznych i szablonowych
  const blacklist = [
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

  return !blacklist.some((keyword) => lower.includes(keyword));
}

/**
 * Czyści nazwę produktu z sufiksów sklepowych (np. " | Media Expert", " - Sklep Online").
 */
function cleanProductName(name: string | undefined | null): string | null {
  if (!name || typeof name !== "string") return null;

  let cleaned = name.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  // Odcinanie typowych sufiksów sklepowych z końcówki:
  // 1. Pipe: " | Media Expert"
  // 2. Myślnik otoczony spacjami: " - Sklep Online" (spacje chronią nazwy z myślnikiem np. USB-C, WH-1000XM5)
  // 3. Sufiksy " w <Sklep>"
  cleaned = cleaned.replace(/\s*\|\s*[^|]+$/i, "");
  cleaned = cleaned.replace(/\s+[-–—]\s+[^–—-]+$/i, "");
  cleaned = cleaned.replace(/\s+w\s+[A-Za-z0-9\s.]+$/i, "");

  cleaned = cleaned.trim();
  if (!cleaned) return null;

  // Ograniczenie do 100 znaków (zgodnie ze schematem bazy danych)
  return cleaned.slice(0, 100);
}

/**
 * Czyści kod produktu do max 24 znaków.
 */
function cleanProductCode(code: string | number | undefined | null): string | null {
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

/**
 * Rekurencyjnie przeszukuje obiekt lub tablicę JSON-LD w poszukiwaniu węzła @type: "Product".
 */
function findProductInJsonLd(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProductInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  const obj = node as Record<string, unknown>;

  // Sprawdzenie typu węzła
  const type = obj["@type"];
  if (
    type === "Product" ||
    (Array.isArray(type) && type.includes("Product")) ||
    (typeof type === "string" && type.toLowerCase() === "product")
  ) {
    return obj;
  }

  // Obsługa struktury @graph
  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const found = findProductInJsonLd(item);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Parsuje dane JSON-LD ze skryptów <script type="application/ld+json">.
 */
function extractFromJsonLd($: cheerio.CheerioAPI, baseUrl: string): JsonLdProductData {
  const result: JsonLdProductData = {};

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const content = $(element).text().trim();
      if (!content) return;

      const parsedJson = JSON.parse(content);
      const productNode = findProductInJsonLd(parsedJson);

      if (productNode) {
        // 1. Ekstrakcja obrazu
        if (!result.imageUrl && productNode.image) {
          const img = productNode.image;
          let candidate: string | null = null;

          if (typeof img === "string") {
            candidate = img;
          } else if (Array.isArray(img) && img.length > 0) {
            const first = img[0];
            if (typeof first === "string") {
              candidate = first;
            } else if (typeof first === "object" && first !== null) {
              const obj = first as Record<string, unknown>;
              candidate = (obj.url || obj.contentUrl) as string;
            }
          } else if (typeof img === "object" && img !== null) {
            const obj = img as Record<string, unknown>;
            candidate = (obj.url || obj.contentUrl) as string;
          }

          if (candidate) {
            const normalized = normalizeUrl(candidate, baseUrl);
            if (normalized && isValidProductImage(normalized)) {
              result.imageUrl = normalized;
            }
          }
        }

        // 2. Ekstrakcja nazwy
        if (!result.name && typeof productNode.name === "string") {
          result.name = cleanProductName(productNode.name);
        }

        // 3. Ekstrakcja kodu produktu (GTIN / SKU / MPN)
        if (!result.code) {
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
            if (cand !== undefined && cand !== null && String(cand).trim()) {
              result.code = cleanProductCode(cand as string | number);
              break;
            }
          }
        }
      }
    } catch {
      // Ignorujemy błędy parsowania pojedynczego skryptu JSON-LD
    }
  });

  return result;
}

/**
 * Wyciąga kod produktu z adresu URL na podstawie popularnych wzorców e-commerce.
 */
function extractCodeFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;

    // Wzorce typu /p/3222380/... (Action.com i inne)
    const pMatch = pathname.match(/\/p\/([0-9A-Za-z_-]{3,24})(?:\/|$)/);
    if (pMatch?.[1]) {
      return cleanProductCode(pMatch[1]);
    }

    // Wzorce typu /(?:id|kod|produkt)-([0-9A-Za-z_-]+)
    const idMatch = pathname.match(/\/(?:id|kod|produkt)-([0-9A-Za-z_-]{3,24})(?:\/|$|\.html)/i);
    if (idMatch?.[1]) {
      return cleanProductCode(idMatch[1]);
    }
  } catch {
    // ignorujemy
  }
  return null;
}

/**
 * Parsuje atrybuty typu srcset i data-srcset, zwracając listę kandydatów URL.
 * Jeśli zdefiniowano wiele rozdzielczości (np. 424w, 1000w), większe wersje są na początku.
 */
function parseSrcset(srcsetValue: string | undefined | null): string[] {
  if (!srcsetValue || typeof srcsetValue !== "string") return [];

  const candidates: string[] = [];
  const entries = srcsetValue.split(",");

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    // Format srcset: "https://domena.pl/img.jpg 424w" lub "https://domena.pl/img.jpg"
    const urlPart = trimmed.split(/\s+/)[0];
    if (urlPart) {
      candidates.push(urlPart);
    }
  }

  // W srcset większe rozdzielczości są zazwyczaj na końcu – odwracamy, aby preferować wyższą jakość
  return candidates.reverse();
}

/**
 * Zbiera wszystkie potencjalne adresy URL obrazka z elementu DOM i jego kontenerów
 * (uwzględniając zoom, lazy-loading, srcset i picture/source).
 */
function extractElementImageCandidates($: cheerio.CheerioAPI, elem: Parameters<cheerio.CheerioAPI>[0]): string[] {
  const $el = $(elem);
  const candidates: (string | undefined)[] = [];

  // 1. Atrybuty wysokiej rozdzielczości i zoomu (np. na elemencie lub jego rodzicu w galeriach)
  candidates.push($el.attr("data-zoom-bg"));
  candidates.push($el.attr("data-zoom-image"));
  candidates.push($el.attr("data-large"));
  candidates.push($el.attr("data-high-res-src"));

  const parentZoomBg = $el.closest("[data-zoom-bg]").attr("data-zoom-bg");
  if (parentZoomBg) candidates.push(parentZoomBg);

  const parentZoomImg = $el.closest("[data-zoom-image]").attr("data-zoom-image");
  if (parentZoomImg) candidates.push(parentZoomImg);

  // 2. Responsive srcset na elemencie (data-srcset oraz srcset)
  const dataSrcsetCandidates = parseSrcset($el.attr("data-srcset"));
  candidates.push(...dataSrcsetCandidates);

  const srcsetCandidates = parseSrcset($el.attr("srcset"));
  candidates.push(...srcsetCandidates);

  // 3. Atrybuty lazy loading
  candidates.push($el.attr("data-src"));
  candidates.push($el.attr("data-original"));

  // 4. Standardowy atrybut src
  candidates.push($el.attr("src"));

  // 5. Atrybuty content / href (dla meta lub link)
  candidates.push($el.attr("content"));
  candidates.push($el.attr("href"));

  // 6. Jeśli element jest wewnątrz <picture>, zbadaj powiązane tagi <source>
  const $parentPicture = $el.parent("picture");
  if ($parentPicture.length > 0) {
    $parentPicture.find("source").each((_, source) => {
      const $source = $(source);
      candidates.push(...parseSrcset($source.attr("data-srcset")));
      candidates.push(...parseSrcset($source.attr("srcset")));
      candidates.push($source.attr("src"));
    });
  }

  return candidates.filter((c): c is string => Boolean(c && typeof c === "string" && c.trim().length > 0));
}

/**
 * Główna funkcja wyciągająca metadane produktu z kodu HTML.
 */
export function extractProductMetadata(html: string, pageUrl: string): ScrapedProductMetadata | null {
  if (!html || !html.trim()) return null;

  const $ = cheerio.load(html);

  // Pobranie danych ze struktury Schema.org (JSON-LD)
  const jsonLdData = extractFromJsonLd($, pageUrl);

  // --- 1. EKSTRAKCJA ZDJĘCIA (Warunek krytyczny sukcesu 4a) ---
  let imageUrl: string | null = null;

  // Priorytet 1: Meta tagi Open Graph & Twitter Cards
  const ogImage =
    $('meta[property="og:image:secure_url"]').attr("content") ||
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $('meta[property="twitter:image"]').attr("content");

  if (ogImage) {
    const normalized = normalizeUrl(ogImage, pageUrl);
    if (normalized && isValidProductImage(normalized)) {
      imageUrl = normalized;
    }
  }

  // Priorytet 2: JSON-LD (jeśli brak z OG lub OG było nieprawidłowe)
  if (!imageUrl && jsonLdData.imageUrl) {
    imageUrl = jsonLdData.imageUrl;
  }

  // Priorytet 3: Mikrodane HTML5 itemprop="image" (pełna analiza atrybutów, srcset i zoom)
  if (!imageUrl) {
    const itempropElems = $('[itemprop="image"]').toArray();
    for (const elem of itempropElems) {
      const candidates = extractElementImageCandidates($, elem);
      for (const cand of candidates) {
        const normalized = normalizeUrl(cand, pageUrl);
        if (normalized && isValidProductImage(normalized)) {
          imageUrl = normalized;
          break;
        }
      }
      if (imageUrl) break;
    }
  }

  // Priorytet 4: Heurystyka DOM selektorów e-commerce
  if (!imageUrl) {
    const domSelectors = [
      '[data-zoom-bg]',
      '[data-zoom-image]',
      '[data-testid*="product-image"] img',
      '[data-gallery] img',
      '.carousel-product img',
      '.carousel-product [data-zoom-bg]',
      '.product-image img',
      '.product-gallery img',
      '.product__media img',
      '.product-media img',
      '.pdp-image img, .pdp-main-image img',
      '.product-detail img, .product-details img',
      '.swiper-slide.carousel-product__item img',
      'picture img',
      'main picture img',
      'article img',
    ];

    for (const selector of domSelectors) {
      if (imageUrl) break;
      const elements = $(selector).toArray();
      for (const elem of elements) {
        const candidates = extractElementImageCandidates($, elem);
        for (const cand of candidates) {
          const normalized = normalizeUrl(cand, pageUrl);
          if (normalized && isValidProductImage(normalized)) {
            imageUrl = normalized;
            break;
          }
        }
        if (imageUrl) break;
      }
    }
  }

  // --- 2. EKSTRAKCJA NAZWY PRODUKTU (Best effort 4b) ---
  let name: string | null = null;

  // Priorytet 1: JSON-LD
  if (jsonLdData.name) {
    name = jsonLdData.name;
  }

  // Priorytet 2: Główny nagłówek <h1> lub dedykowane klasy tytułu produktu
  if (!name) {
    const h1Text = $(
      "main h1, article h1, h1, .product-name, .product-title, .pdp-title"
    ).first().text();
    name = cleanProductName(h1Text);
  }

  // Priorytet 3: Mikrodane HTML5 itemprop="name" (preferowany kontekst Product lub ostatni okruszek)
  if (!name) {
    const productScopeName = $('[itemscope][itemtype*="Product"] [itemprop="name"]').first().text();
    if (productScopeName) {
      name = cleanProductName(productScopeName);
    } else {
      const allItempropNames = $('[itemprop="name"]').toArray();
      if (allItempropNames.length > 0) {
        // W okruszkach chleba (BreadcrumbList) ostatni element to nazwa produktu, pierwszy to sklep
        const lastItempropName = $(allItempropNames[allItempropNames.length - 1]).text();
        name = cleanProductName(lastItempropName);
      }
    }
  }

  // Priorytet 4: Meta tagi og:title / twitter:title
  if (!name) {
    const metaTitle =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content");
    name = cleanProductName(metaTitle);
  }

  // Priorytet 5: <title>
  if (!name) {
    const pageTitle = $("title").first().text();
    name = cleanProductName(pageTitle);
  }

  // --- 3. EKSTRAKCJA KODU PRODUKTU (Best effort 4c) ---
  let code: string | null = null;

  // Priorytet 1: JSON-LD
  if (jsonLdData.code) {
    code = jsonLdData.code;
  }

  // Priorytet 2: Mikrodane HTML5
  if (!code) {
    const itempropCode = $(
      '[itemprop="gtin13"], [itemprop="gtin"], [itemprop="sku"], [itemprop="mpn"], [itemprop="productID"]'
    ).first();
    const rawVal = itempropCode.attr("content") || itempropCode.text();
    code = cleanProductCode(rawVal);
  }

  // Priorytet 3: Wzorce tabeli specyfikacji technicznej w DOM
  if (!code) {
    const labelPatterns = /EAN|Kod produktu|Symbol|Numer artykułu|SKU|Kod producenta/i;

    $("table tr, dl, .specifications tr, .product-attributes li, li").each((_, row) => {
      if (code) return; // znaleziono

      const rowText = $(row).text();
      if (labelPatterns.test(rowText)) {
        // Spróbuj odnaleźć komórkę td lub dd
        const valueEl = $(row).find("td:last-child, dd").first();
        const valueText = valueEl.length > 0 ? valueEl.text() : rowText.replace(labelPatterns, "");
        const cand = valueText.replace(/[:]/g, "").trim();
        if (cand && cand.length <= 24 && /^[A-Za-z0-9_-]+$/.test(cand)) {
          code = cleanProductCode(cand);
        }
      }
    });
  }

  // Priorytet 4: Ekstrakcja z adresu URL (np. Action.com: /p/3222380/)
  if (!code) {
    code = extractCodeFromUrl(pageUrl);
  }

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
