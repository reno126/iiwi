import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AddReviewFlow } from "@/app/opinie/dodaj/_components/AddReviewFlow";
import {
  saveReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";
import type { Product } from "@/prisma/generated/client";

// Mocks
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "user-test" } },
    status: "authenticated",
    update: vi.fn(),
  }),
}));

vi.mock("@/serverActions/productSearch", () => ({
  productSearch: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("@/serverActions/shopMatchByUrlAction", () => ({
  shopMatchByUrlAction: vi.fn().mockResolvedValue(null),
}));

describe("AddReviewFlow - Rehydration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearReviewDraft();
  });

  it("renders SEARCHING mode by default when no draft exists", () => {
    render(<AddReviewFlow />);
    expect(
      screen.getByText("Wybierz produkt z bazy lub dodaj nowy, aby podzielić się swoją opinią.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Dodaj nowy produkt/i })
    ).toBeInTheDocument();
  });

  it("rehydrates directly into NEW_PRODUCT_AND_REVIEW mode when a new product draft exists", async () => {
    saveReviewDraft({
      type: "NEW_PRODUCT_AND_REVIEW",
      formData: {
        name: "Test Draft Product",
        rate: 5,
        description: "Great draft!",
      },
    });

    render(<AddReviewFlow />);

    // Instead of SEARCHING mode, it should show CombinedProductReviewForm
    expect(
      screen.queryByText("Wybierz produkt z bazy lub dodaj nowy, aby podzielić się swoją opinią.")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Twoje dane zostały przywrócone po zalogowaniu/i),
    ).toBeInTheDocument();
  });

  it("rehydrates directly into REVIEW_EXISTING_PRODUCT mode when an existing product draft exists", () => {
    const mockProduct: Product = {
      id: "prod-existing-123",
      name: "Existing Laptop",
      productUrl: null,
      imageUrl: null,
      code: null,
      shopId: null,
      creatorId: "user-1",
      rate_avg: 4.5,
      rate_count: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveReviewDraft({
      type: "REVIEW_EXISTING_PRODUCT",
      productId: mockProduct.id,
      product: mockProduct,
      formData: {
        productId: mockProduct.id,
        rate: 4,
        description: "Rehydrated existing review",
      },
    });

    render(<AddReviewFlow />);

    // Should display selected product card and review form
    expect(screen.getByText("Existing Laptop")).toBeInTheDocument();
    expect(screen.getByText("Napisz swoją opinię")).toBeInTheDocument();
    expect(
      screen.getByText(/Twoja opinia została przywrócona po zalogowaniu/i)
    ).toBeInTheDocument();
  });
});
