import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AddReviewFlow,
  ADD_REVIEW_FLOW_MESSAGES,
} from "@/app/opinie/dodaj/_components/AddReviewFlow";
import { COMBINED_FORM_MESSAGES } from "@/app/opinie/dodaj/_components/CombinedProductReviewForm";
import { REVIEW_FORM_MESSAGES } from "@/components/reviews/ReviewForm";
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
      screen.getByText(ADD_REVIEW_FLOW_MESSAGES.searchingDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: ADD_REVIEW_FLOW_MESSAGES.addNewProductButton,
      }),
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
      screen.queryByText(ADD_REVIEW_FLOW_MESSAGES.searchingDescription),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(COMBINED_FORM_MESSAGES.draftRestored),
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

    expect(screen.getByText("Existing Laptop")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: ADD_REVIEW_FLOW_MESSAGES.formHeading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(REVIEW_FORM_MESSAGES.draftRestored),
    ).toBeInTheDocument();
  });
});
