import type {
  Product,
  BreadcrumbList,
  ItemList,
  WebSite,
  WithContext,
  WithActionConstraints,
  SearchAction,
} from "schema-dts";
import type { ProductWithReviews } from "@/serverActions/productGetById";

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }
  return "https://iiwi.vercel.app";
}

export interface ProductDetailGraph {
  "@context": "https://schema.org";
  "@graph": [Product, BreadcrumbList];
}

export interface ProductsCatalogGraph {
  "@context": "https://schema.org";
  "@graph": [BreadcrumbList, ItemList];
}

export function buildProductDetailSchema(
  product: ProductWithReviews,
  baseUrl = getBaseUrl(),
): ProductDetailGraph {
  const productUrl = `${baseUrl}/produkty/${product.id}`;

  const productNode: Product = {
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description: `Opinie i recenzje o ${product.name} w serwisie TrueReview.`,
    url: productUrl,
    image: product.imageUrl ?? undefined,
    sku: product.code ?? undefined,
    brand: product.shop?.name
      ? {
          "@type": "Brand",
          name: product.shop.name,
        }
      : undefined,
    aggregateRating:
      product.rate_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(product.rate_avg.toFixed(1)),
            reviewCount: product.rate_count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review:
      product.reviews.length > 0
        ? product.reviews.map((r) => ({
            "@type": "Review",
            "@id": `${productUrl}#review-${r.id}`,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rate,
              bestRating: 5,
              worstRating: 1,
            },
            author: {
              "@type": "Person",
              name: r.user.name || "Użytkownik TrueReview",
            },
            datePublished: r.createdAt.toISOString(),
            reviewBody: r.description,
          }))
        : undefined,
  };

  const breadcrumbNode: BreadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": `${productUrl}#breadcrumbs`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Strona główna",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Produkty",
        item: `${baseUrl}/produkty`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [productNode, breadcrumbNode],
  };
}

export interface CatalogProductSummary {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export function buildProductsCatalogSchema(
  products: CatalogProductSummary[],
  page = 1,
  baseUrl = getBaseUrl(),
): ProductsCatalogGraph {
  const currentUrl =
    page > 1 ? `${baseUrl}/produkty?page=${page}` : `${baseUrl}/produkty`;

  const breadcrumbNode: BreadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": `${currentUrl}#breadcrumbs`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Strona główna",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Produkty",
        item: `${baseUrl}/produkty`,
      },
    ],
  };

  const itemListNode: ItemList = {
    "@type": "ItemList",
    "@id": `${currentUrl}#itemlist`,
    name: "Katalog produktów z rzetelnymi opiniami",
    numberOfItems: products.length,
    itemListElement: products.map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: p.name,
      url: `${baseUrl}/produkty/${p.id}`,
      image: p.imageUrl ?? undefined,
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [breadcrumbNode, itemListNode],
  };
}

export function buildWebSiteSchema(baseUrl = getBaseUrl()): WithContext<WebSite> {
  const potentialAction: WithActionConstraints<SearchAction> = {
    "@type": "SearchAction",
    target: `${baseUrl}/produkty?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  };

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}#website`,
    name: "TrueReview",
    url: baseUrl,
    potentialAction,
  };
}
