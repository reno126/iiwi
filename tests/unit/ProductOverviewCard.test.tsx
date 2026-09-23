import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductOverviewCard } from "@/app/produkty/[id]/_components/ProductOverviewCard";
import type { ProductWithReviews } from "@/serverActions/productGetById";

describe("app/produkty/[id]/_components/ProductOverviewCard", () => {
  const mockProduct: ProductWithReviews = {
    id: "product-test-1",
    name: "Klawiatura Mechaniczna Pro",
    productUrl: "https://sklep.pl/elektronika/klawiatura-mechaniczna-rgb-pro",
    imageUrl: "https://sklep.pl/img/klawiatura.png",
    code: "SKU-998877",
    creatorId: "user-test-1",
    shopId: "shop-test-1",
    rate_avg: 4.5,
    rate_count: 10,
    createdAt: new Date("2026-05-10T10:00:00Z"),
    updatedAt: new Date("2026-05-10T10:00:00Z"),
    creator: {
      id: "user-test-1",
      name: "Anna Nowak",
      email: "anna.nowak@example.com",
    },
    shop: {
      id: "shop-test-1",
      name: "Sklep Pro",
      logo: null,
    },
    reviews: [],
    _count: {
      reviews: 10,
    },
    averageRate: 4.5,
  };

  it("renders external product link trimmed with truncate, title, and external target attributes", () => {
    const handleAddReview = vi.fn();
    render(
      <ProductOverviewCard
        product={mockProduct}
        onAddReview={handleAddReview}
        isReviewFormOpen={false}
      />,
    );

    const productLink = screen.getByRole("link");
    expect(productLink).toBeInTheDocument();
    expect(productLink).toHaveAttribute("href", mockProduct.productUrl);
    expect(productLink).toHaveAttribute("title", mockProduct.productUrl ?? "");
    expect(productLink).toHaveTextContent(mockProduct.productUrl ?? "");
    expect(productLink).toHaveAttribute("target", "_blank");
    expect(productLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(productLink.querySelector(".truncate")).toBeInTheDocument();
  });
});
