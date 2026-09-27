import { z } from "zod";
import {
  productCreateSchema,
  productCreatedOutputSchema,
} from "@/schemas/product";
import {
  reviewCreateSchema,
  reviewCreatedOutputSchema,
} from "@/schemas/review";

export const productWithReviewCreateSchema = productCreateSchema.extend(
  reviewCreateSchema.omit({ productId: true }).shape,
);

export type ProductWithReviewCreateInput = z.infer<
  typeof productWithReviewCreateSchema
>;

export const productWithReviewCreatedOutputSchema = z.object({
  product: productCreatedOutputSchema,
  review: reviewCreatedOutputSchema,
});

export type ProductWithReviewCreatedOutput = z.infer<
  typeof productWithReviewCreatedOutputSchema
>;
