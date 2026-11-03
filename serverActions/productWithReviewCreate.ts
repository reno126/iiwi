"use server";

import { revalidatePath, updateTag } from "next/cache";
import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";
import { prisma } from "@/lib/db/prisma";
import { updateProductRating } from "@/lib/reviews/productRatings";
import {
  productWithReviewCreateSchema,
  productWithReviewCreatedOutputSchema,
  type ProductWithReviewCreatedOutput,
} from "@/schemas/productWithReview";

export const productWithReviewCreate = safeActionUserCtx
  .inputSchema(productWithReviewCreateSchema)
  .outputSchema(productWithReviewCreatedOutputSchema)
  .action(
    async ({ parsedInput, ctx }): Promise<ProductWithReviewCreatedOutput> => {
      const { name, productUrl, imageUrl, code, shopId, rate, description } =
        parsedInput;
      const { userId } = ctx;

      return await prisma.$transaction(async (transaction) => {
        const product = await transaction.product.create({
          data: {
            name,
            productUrl: productUrl || null,
            imageUrl: imageUrl || null,
            code: code || null,
            shopId: shopId || null,
            creatorId: userId,
            rate_avg: 0,
            rate_count: 0,
          },
        });

        const review = await transaction.review.create({
          data: {
            productId: product.id,
            rate,
            description,
            userId,
          },
        });

        const updatedProduct = await updateProductRating(
          transaction,
          product.id,
        );

        const responsePayload: ProductWithReviewCreatedOutput = {
          product: {
            id: updatedProduct.id,
            name: updatedProduct.name,
            productUrl: updatedProduct.productUrl,
            imageUrl: updatedProduct.imageUrl,
            code: updatedProduct.code,
            shopId: updatedProduct.shopId ?? null,
            rate_avg: updatedProduct.rate_avg,
            rate_count: updatedProduct.rate_count,
          },
          review: {
            id: review.id,
            productId: review.productId,
            rate: review.rate,
            description: review.description,
            userId: review.userId,
            createdAt: review.createdAt,
          },
        };

        try {
          updateTag("products-count");
          revalidatePath("/produkty");
        } catch {
          return responsePayload;
        }

        return responsePayload;
      });
    },
  );
