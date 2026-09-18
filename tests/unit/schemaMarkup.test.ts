import { describe, it, expect } from "vitest";
import {
  getBaseUrl,
  buildProductDetailSchema,
  buildProductsCatalogSchema,
  buildWebSiteSchema,
} from "@/lib/seo/schemaMarkup";
import type { ProductWithReviews } from "@/serverActions/productGetById";

const baseProductMock: ProductWithReviews = {
  id: "prod-abc-123",
  name: "Kawa Ziarnista 1kg",
  productUrl: "https://example.com/kawa",
  imageUrl: "https://example.com/kawa.jpg",
  code: "5901234567890",
  creatorId: "user-1",
  shopId: "shop-1",
  rate_avg: 4.67,
  rate_count: 3,
  createdAt: new Date("2026-03-01T12:00:00Z"),
  updatedAt: new Date("2026-03-02T12:00:00Z"),
  creator: {
    id: "user-1",
    name: "Jan",
    email: "jan@example.com",
  },
  shop: {
    id: "shop-1",
    name: "Sklep Kawowy",
    logo: "https://example.com/logo.png",
  },
  reviews: [
    {
      id: "rev-1",
      description: "Bardzo aromatyczna kawa, polecam!",
      rate: 5,
      likes: 2,
      productId: "prod-abc-123",
      userId: "user-2",
      createdAt: new Date("2026-03-05T10:30:00Z"),
      updatedAt: new Date("2026-03-05T10:30:00Z"),
      user: {
        id: "user-2",
        name: "Anna Nowak",
        email: "anna@example.com",
        image: null,
      },
    },
    {
      id: "rev-2",
      description: "Dobra, ale mogłaby być mocniej wypalona.",
      rate: 4,
      likes: 0,
      productId: "prod-abc-123",
      userId: "user-3",
      createdAt: new Date("2026-03-06T14:15:00Z"),
      updatedAt: new Date("2026-03-06T14:15:00Z"),
      user: {
        id: "user-3",
        name: null,
        email: "anonim@example.com",
        image: null,
      },
    },
  ],
  _count: {
    reviews: 2,
  },
  averageRate: 4.67,
};

describe("lib/seo/schemaMarkup", () => {
  it("returns configured baseUrl or default fallback", () => {
    const url = getBaseUrl();
    expect(url).toMatch(/^https?:\/\//);
  });

  it("builds complete Product and BreadcrumbList schema graph for a rated product", () => {
    const schema = buildProductDetailSchema(baseProductMock, "https://iiwi.test");

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@graph"]).toHaveLength(2);

    const [productNode, breadcrumbNode] = schema["@graph"];

    expect(productNode["@type"]).toBe("Product");
    expect(productNode["@id"]).toBe("https://iiwi.test/produkty/prod-abc-123#product");
    expect(productNode.name).toBe("Kawa Ziarnista 1kg");
    expect(productNode.image).toBe("https://example.com/kawa.jpg");
    expect(productNode.sku).toBe("5901234567890");
    expect(productNode.brand).toEqual({
      "@type": "Brand",
      name: "Sklep Kawowy",
    });

    expect(productNode.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.7,
      reviewCount: 3,
      bestRating: 5,
      worstRating: 1,
    });

    const reviews = Array.isArray(productNode.review) ? productNode.review : [];
    expect(reviews).toHaveLength(2);
    expect(reviews[0]).toMatchObject({
      "@type": "Review",
      "@id": "https://iiwi.test/produkty/prod-abc-123#review-rev-1",
      reviewRating: {
        "@type": "Rating",
        ratingValue: 5,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        "@type": "Person",
        name: "Anna Nowak",
      },
      datePublished: "2026-03-05T10:30:00.000Z",
      reviewBody: "Bardzo aromatyczna kawa, polecam!",
    });

    expect(reviews[1]).toMatchObject({
      author: {
        "@type": "Person",
        name: "Użytkownik TrueReview",
      },
    });

    expect(breadcrumbNode["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbNode["@id"]).toBe("https://iiwi.test/produkty/prod-abc-123#breadcrumbs");
    expect(breadcrumbNode.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Strona główna",
        item: "https://iiwi.test",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Produkty",
        item: "https://iiwi.test/produkty",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Kawa Ziarnista 1kg",
        item: "https://iiwi.test/produkty/prod-abc-123",
      },
    ]);
  });

  it("omits aggregateRating and review when product has no reviews or zero count", () => {
    const unratedProduct: ProductWithReviews = {
      ...baseProductMock,
      rate_avg: 0,
      rate_count: 0,
      reviews: [],
      shop: null,
      code: null,
      imageUrl: null,
    };

    const schema = buildProductDetailSchema(unratedProduct, "https://iiwi.test");
    const [productNode] = schema["@graph"];

    expect(productNode.aggregateRating).toBeUndefined();
    expect(productNode.review).toBeUndefined();
    expect(productNode.brand).toBeUndefined();
    expect(productNode.sku).toBeUndefined();
    expect(productNode.image).toBeUndefined();
  });

  it("builds ItemList and BreadcrumbList schema graph for catalog page", () => {
    const catalogProducts = [
      { id: "p-1", name: "Produkt 1", imageUrl: "https://example.com/p1.png" },
      { id: "p-2", name: "Produkt 2", imageUrl: null },
    ];

    const schema = buildProductsCatalogSchema(catalogProducts, 2, "https://iiwi.test");

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@graph"]).toHaveLength(2);

    const [breadcrumbNode, itemListNode] = schema["@graph"];

    expect(breadcrumbNode["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbNode["@id"]).toBe("https://iiwi.test/produkty?page=2#breadcrumbs");

    expect(itemListNode["@type"]).toBe("ItemList");
    expect(itemListNode["@id"]).toBe("https://iiwi.test/produkty?page=2#itemlist");
    expect(itemListNode.numberOfItems).toBe(2);
    expect(itemListNode.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Produkt 1",
        url: "https://iiwi.test/produkty/p-1",
        image: "https://example.com/p1.png",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Produkt 2",
        url: "https://iiwi.test/produkty/p-2",
        image: undefined,
      },
    ]);
  });

  it("builds WebSite schema with potential SearchAction", () => {
    const schema = buildWebSiteSchema("https://iiwi.test");

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("WebSite");
    expect(schema["@id"]).toBe("https://iiwi.test#website");
    expect(schema.name).toBe("TrueReview");
    expect(schema.url).toBe("https://iiwi.test");
    expect(schema.potentialAction).toEqual({
      "@type": "SearchAction",
      target: "https://iiwi.test/produkty?q={search_term_string}",
      "query-input": "required name=search_term_string",
    });
  });
});
