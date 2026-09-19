import { z } from "zod";
import { productCreateSchema } from "@/schemas/product";
import { reviewCreateSchema } from "@/schemas/review";

export const productWithReviewCreateSchema = productCreateSchema.extend(
  reviewCreateSchema.omit({ productId: true }).shape,
);

export type ProductWithReviewCreateInput = z.infer<
  typeof productWithReviewCreateSchema
>;
