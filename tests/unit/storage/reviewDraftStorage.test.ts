import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveReviewDraft,
  getReviewDraft,
  getReviewDraftReturnUrl,
  clearReviewDraft,
  REVIEW_DRAFT_STORAGE_KEY,
  type NewProductReviewDraft,
  type ExistingProductReviewDraft,
} from "@/lib/storage/reviewDraftStorage";

describe("lib/storage/reviewDraftStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  const mockNewProductDraft: NewProductReviewDraft = {
    type: "NEW_PRODUCT_AND_REVIEW",
    formData: {
      name: "Smartfon XYZ",
      rate: 5,
      description: "Bardzo dobry telefon.",
    },
    phase: {
      mode: "scraped_success",
      scrapedFields: ["name"],
    },
  };

  const mockExistingProductDraft: ExistingProductReviewDraft = {
    type: "REVIEW_EXISTING_PRODUCT",
    productId: "product-abc-123",
    formData: {
      productId: "product-abc-123",
      rate: 4,
      description: "Polecam ten produkt.",
    },
  };

  it("saves and retrieves a NEW_PRODUCT_AND_REVIEW draft", () => {
    const success = saveReviewDraft(mockNewProductDraft);
    expect(success).toBe(true);

    const retrieved = getReviewDraft();
    expect(retrieved).toEqual(mockNewProductDraft);
  });

  it("saves and retrieves a REVIEW_EXISTING_PRODUCT draft", () => {
    const success = saveReviewDraft(mockExistingProductDraft);
    expect(success).toBe(true);

    const retrieved = getReviewDraft();
    expect(retrieved).toEqual(mockExistingProductDraft);
  });

  it("clears review draft from storage", () => {
    saveReviewDraft(mockNewProductDraft);
    expect(getReviewDraft()).not.toBeNull();

    clearReviewDraft();
    expect(getReviewDraft()).toBeNull();
    expect(window.localStorage.getItem(REVIEW_DRAFT_STORAGE_KEY)).toBeNull();
  });

  describe("getReviewDraftReturnUrl", () => {
    it("returns default fallbackUrl (/dashboard) when no draft exists", () => {
      expect(getReviewDraftReturnUrl()).toBe("/dashboard");
    });

    it("returns custom fallbackUrl when provided and no draft exists", () => {
      expect(getReviewDraftReturnUrl("/custom-fallback")).toBe(
        "/custom-fallback",
      );
    });

    it("returns draft.returnUrl when explicitly specified", () => {
      saveReviewDraft({
        ...mockNewProductDraft,
        returnUrl: "/produkty/kategoria/elektronika",
      });

      expect(getReviewDraftReturnUrl()).toBe("/produkty/kategoria/elektronika");
    });

    it("returns /opinie/dodaj for NEW_PRODUCT_AND_REVIEW draft when returnUrl is omitted", () => {
      saveReviewDraft(mockNewProductDraft);
      expect(getReviewDraftReturnUrl()).toBe("/opinie/dodaj");
    });

    it("returns /produkty/:id for REVIEW_EXISTING_PRODUCT draft when returnUrl is omitted", () => {
      saveReviewDraft(mockExistingProductDraft);
      expect(getReviewDraftReturnUrl()).toBe("/produkty/product-abc-123");
    });

    it("returns /opinie/dodaj for REVIEW_EXISTING_PRODUCT draft when productId is empty", () => {
      saveReviewDraft({
        ...mockExistingProductDraft,
        productId: "",
      });
      expect(getReviewDraftReturnUrl()).toBe("/opinie/dodaj");
    });
  });
});
