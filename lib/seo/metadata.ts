import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/seo/schemaMarkup";
import type { ProductWithReviews } from "@/serverActions/productGetById";

export const DEFAULT_SITE_NAME = "TrueReview";
export const DEFAULT_SITE_TITLE = "TrueReview :: Czy warto?";
export const DEFAULT_SITE_DESCRIPTION = "Realne opinie. Lepsze wybory.";
export const DEFAULT_TITLE_TEMPLATE = "%s | TrueReview";
export const DEFAULT_LOCALE = "pl_PL";

export interface PageMetadataOptions {
  title: string;
  description: string;
  path?: string;
  imageUrl?: string | null;
  noIndex?: boolean;
}

function stripSiteNameSuffix(title: string): string {
  const suffix = ` | ${DEFAULT_SITE_NAME}`;
  if (title.endsWith(suffix)) {
    return title.slice(0, -suffix.length);
  }
  return title;
}

function formatFullTitle(title: string): string {
  if (title.includes(DEFAULT_SITE_NAME)) {
    return title;
  }
  return `${title} | ${DEFAULT_SITE_NAME}`;
}

function buildAbsoluteUrl(path?: string): string | undefined {
  if (!path) {
    return undefined;
  }
  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function formatReviewCountLabel(count: number): string {
  if (count === 1) {
    return "opinia";
  }
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    !(lastTwoDigits >= 12 && lastTwoDigits <= 14)
  ) {
    return "opinie";
  }
  return "opinii";
}

function formatProductDescription(product: ProductWithReviews): string {
  const ratingSuffix =
    product.rate_count > 0
      ? ` Ocena: ${product.rate_avg.toFixed(1)}/5 (${product.rate_count} ${formatReviewCountLabel(product.rate_count)}).`
      : "";
  return `Sprawdź recenzje i opinie o produkcie ${product.name} w serwisie TrueReview.${ratingSuffix}`;
}

export function buildRootMetadata(): Metadata {
  const baseUrl = getBaseUrl();
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: DEFAULT_SITE_TITLE,
      template: DEFAULT_TITLE_TEMPLATE,
    },
    description: DEFAULT_SITE_DESCRIPTION,
    openGraph: {
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_SITE_DESCRIPTION,
      url: baseUrl,
      siteName: DEFAULT_SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_SITE_DESCRIPTION,
    },
  };
}

export function buildPageMetadata(options: PageMetadataOptions): Metadata {
  const cleanTitle = stripSiteNameSuffix(options.title);
  const fullTitle = formatFullTitle(options.title);
  const canonicalUrl = buildAbsoluteUrl(options.path);

  const images = options.imageUrl
    ? [
        {
          url: options.imageUrl,
          alt: fullTitle,
        },
      ]
    : undefined;

  return {
    title: cleanTitle,
    description: options.description,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      title: fullTitle,
      description: options.description,
      url: canonicalUrl,
      type: "website",
      images,
    },
    twitter: {
      card: options.imageUrl ? "summary_large_image" : "summary",
      title: fullTitle,
      description: options.description,
      images: options.imageUrl ? [options.imageUrl] : undefined,
    },
    robots: options.noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export function buildProductMetadata(
  product: ProductWithReviews | null,
): Metadata {
  if (!product) {
    return buildPageMetadata({
      title: "Produkt nie znaleziony",
      description: "Szukany produkt nie istnieje w bazie danych TrueReview.",
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${product.name} - Opinie`,
    description: formatProductDescription(product),
    path: `/produkty/${product.id}`,
    imageUrl: product.imageUrl,
  });
}
