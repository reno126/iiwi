import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AddReviewFlow } from "@/app/opinie/dodaj/_components/AddReviewFlow";
import {
  saveReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";
import type { Product } from "@/prisma/generated/client";

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
      screen.getByText(
        /wybierz produkt z bazy lub dodaj nowy, aby podzielić się swoją opinią/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /dodaj nowy produkt/i }),
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

    expect(
      screen.queryByText(
        /wybierz produkt z bazy lub dodaj nowy, aby podzielić się swoją opinią/i,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/twoje dane zostały przywrócone po zalogowaniu/i),
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

    expect(screen.getByText(/existing laptop/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /napisz swoją opinię/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/twoja opinia została przywrócona po zalogowaniu/i),
    ).toBeInTheDocument();
  });
});
