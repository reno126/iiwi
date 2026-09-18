import { describe, it, expect } from "vitest";
import {
  buildRootMetadata,
  buildPageMetadata,
  buildProductMetadata,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_TITLE,
  DEFAULT_SITE_DESCRIPTION,
} from "@/lib/seo/metadata";
import type { ProductWithReviews } from "@/serverActions/productGetById";

describe("metadata generators", () => {
  describe("buildRootMetadata", () => {
    it("builds root metadata with default site information and metadataBase", () => {
      const rootMetadata = buildRootMetadata();

      expect(rootMetadata.metadataBase).toBeDefined();
      expect(rootMetadata.description).toBe(DEFAULT_SITE_DESCRIPTION);
      expect(rootMetadata.title).toEqual({
        default: DEFAULT_SITE_TITLE,
        template: `%s | ${DEFAULT_SITE_NAME}`,
      });
      expect(rootMetadata.openGraph).toMatchObject({
        title: DEFAULT_SITE_TITLE,
        description: DEFAULT_SITE_DESCRIPTION,
        siteName: DEFAULT_SITE_NAME,
        locale: "pl_PL",
        type: "website",
      });
      expect(rootMetadata.twitter).toMatchObject({
        card: "summary",
        title: DEFAULT_SITE_TITLE,
        description: DEFAULT_SITE_DESCRIPTION,
      });
    });
  });

  describe("buildPageMetadata", () => {
    it("generates page metadata with canonical link and default robots", () => {
      const pageMetadata = buildPageMetadata({
        title: "Produkty",
        description: "Lista wszystkich produktów",
        path: "/produkty",
      });

      expect(pageMetadata.title).toBe("Produkty");
      expect(pageMetadata.description).toBe("Lista wszystkich produktów");
      expect(pageMetadata.alternates?.canonical).toBe(
        "https://iiwi.vercel.app/produkty",
      );
      expect(pageMetadata.openGraph?.title).toBe("Produkty | TrueReview");
      expect(pageMetadata.openGraph?.url).toBe(
        "https://iiwi.vercel.app/produkty",
      );
      expect(pageMetadata.twitter).toMatchObject({
        card: "summary",
        title: "Produkty | TrueReview",
        description: "Lista wszystkich produktów",
      });
      expect(pageMetadata.robots).toEqual({
        index: true,
        follow: true,
      });
    });

    it("strips duplicate site name suffix from title for layout template compatibility", () => {
      const pageMetadata = buildPageMetadata({
        title: "Produkty | TrueReview",
        description: "Opis",
      });

      expect(pageMetadata.title).toBe("Produkty");
      expect(pageMetadata.openGraph?.title).toBe("Produkty | TrueReview");
    });

    it("configures large image cards when an image url is provided", () => {
      const pageMetadata = buildPageMetadata({
        title: "Klawiatura Mechaniczna",
        description: "Opinie o klawiaturze",
        imageUrl: "https://example.com/keyboard.jpg",
      });

      expect(pageMetadata.openGraph?.images).toEqual([
        {
          url: "https://example.com/keyboard.jpg",
          alt: "Klawiatura Mechaniczna | TrueReview",
        },
      ]);
      expect(pageMetadata.twitter).toMatchObject({
        card: "summary_large_image",
        images: ["https://example.com/keyboard.jpg"],
      });
    });

    it("sets robots to noindex and nofollow when noIndex is true", () => {
      const pageMetadata = buildPageMetadata({
        title: "Panel użytkownika",
        description: "Prywatny panel",
        noIndex: true,
      });

      expect(pageMetadata.robots).toEqual({
        index: false,
        follow: false,
      });
    });
  });

  describe("buildProductMetadata", () => {
    it("returns not found metadata when product is null", () => {
      const notFoundMetadata = buildProductMetadata(null);

      expect(notFoundMetadata.title).toBe("Produkt nie znaleziony");
      expect(notFoundMetadata.description).toBe(
        "Szukany produkt nie istnieje w bazie danych TrueReview.",
      );
      expect(notFoundMetadata.robots).toEqual({
        index: false,
        follow: false,
      });
    });

    it("builds rich product metadata with ratings and reviews", () => {
      const mockProduct: ProductWithReviews = {
        id: "prod-123",
        name: "Ekspres do kawy",
        productUrl: "https://sklep.pl/ekspres",
        imageUrl: "https://sklep.pl/img.jpg",
        code: "EKSP-123",
        creatorId: "user-1",
        shopId: "shop-1",
        rate_avg: 4.8,
        rate_count: 5,
        averageRate: 4.8,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        creator: { id: "user-1", name: "Jan", email: "jan@example.com" },
        shop: { id: "shop-1", name: "Media Markt", logo: null },
        reviews: [],
        _count: { reviews: 5 },
      };

      const productMetadata = buildProductMetadata(mockProduct);

      expect(productMetadata.title).toBe("Ekspres do kawy - Opinie");
      expect(productMetadata.description).toContain("Ekspres do kawy");
      expect(productMetadata.description).toContain("Ocena: 4.8/5 (5 opinii)");
      expect(productMetadata.alternates?.canonical).toBe(
        "https://iiwi.vercel.app/produkty/prod-123",
      );
      expect(productMetadata.openGraph?.images).toEqual([
        {
          url: "https://sklep.pl/img.jpg",
          alt: "Ekspres do kawy - Opinie | TrueReview",
        },
      ]);
    });

    it("formats singular review count correctly when count is 1", () => {
      const mockProduct: ProductWithReviews = {
        id: "prod-456",
        name: "Słuchawki",
        productUrl: null,
        imageUrl: null,
        code: null,
        creatorId: "user-1",
        shopId: null,
        rate_avg: 5.0,
        rate_count: 1,
        averageRate: 5.0,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        creator: { id: "user-1", name: "Jan", email: "jan@example.com" },
        reviews: [],
        _count: { reviews: 1 },
      };

      const productMetadata = buildProductMetadata(mockProduct);

      expect(productMetadata.description).toContain("Ocena: 5.0/5 (1 opinia)");
    });
  });
});
