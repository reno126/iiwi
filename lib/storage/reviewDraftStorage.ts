import type { ProductWithReviewCreateInput } from "@/schemas/productWithReview";
import type { ReviewCreateInput } from "@/schemas/review";
import type { Product } from "@/prisma/generated/client";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";
import {
  setItemWithTtl,
  getItemWithTtl,
  removeItemWithTtl,
  DEFAULT_TTL_MS,
} from "./ttlStorage";

export const REVIEW_DRAFT_STORAGE_KEY = "iiwi_pending_review_draft";

export type ScrapedFieldType = "name" | "imageUrl" | "code" | "shop";

export interface NewProductReviewDraft {
  type: "NEW_PRODUCT_AND_REVIEW";
  returnUrl?: string;
  formData: ProductWithReviewCreateInput;
  phase?: {
    mode: "scraped_success" | "scraped_failed" | "manual";
    scrapedFields?: ScrapedFieldType[];
    scrapeError?: string | null;
  };
  detectedShop?: MatchedShopResult | null;
}

export interface ExistingProductReviewDraft {
  type: "REVIEW_EXISTING_PRODUCT";
  returnUrl?: string;
  productId: string;
  product?: Product;
  formData: ReviewCreateInput;
}

export type ReviewDraft = NewProductReviewDraft | ExistingProductReviewDraft;

export function saveReviewDraft(
  draft: ReviewDraft,
  ttlMs: number = DEFAULT_TTL_MS,
): boolean {
  return setItemWithTtl<ReviewDraft>(REVIEW_DRAFT_STORAGE_KEY, draft, ttlMs);
}

export function getReviewDraft(): ReviewDraft | null {
  return getItemWithTtl<ReviewDraft>(REVIEW_DRAFT_STORAGE_KEY);
}

export function getReviewDraftReturnUrl(fallbackUrl = "/dashboard"): string {
  const draft = getReviewDraft();
  if (!draft) return fallbackUrl;

  if (draft.returnUrl) return draft.returnUrl;
  if (draft.type === "NEW_PRODUCT_AND_REVIEW") return "/opinie/dodaj";
  if (draft.type === "REVIEW_EXISTING_PRODUCT") {
    return draft.productId ? `/produkty/${draft.productId}` : "/opinie/dodaj";
  }

  return fallbackUrl;
}

export function clearReviewDraft(): void {
  removeItemWithTtl(REVIEW_DRAFT_STORAGE_KEY);
}
