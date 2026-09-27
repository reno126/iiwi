"use server";

import { revalidatePath, updateTag } from "next/cache";
import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";
import { prisma } from "@/lib/db/prisma";
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

      return await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
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

        const review = await tx.review.create({
          data: {
            productId: product.id,
            rate,
            description,
            userId,
          },
        });

        const aggregations = await tx.review.aggregate({
          where: { productId: product.id },
          _avg: { rate: true },
          _count: { rate: true },
        });

        const rate_avg =
          aggregations._avg.rate !== null
            ? Number(aggregations._avg.rate.toFixed(2))
            : 0;
        const rate_count = aggregations._count.rate;

        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: {
            rate_avg,
            rate_count,
          },
        });

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
