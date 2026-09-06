"use server";

import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";
import { prisma } from "@/lib/db/prisma";
import { productWithReviewCreateSchema } from "@/schemas/productWithReview";

export const productWithReviewCreate = safeActionUserCtx
  .inputSchema(productWithReviewCreateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, productUrl, imageUrl, code, rate, description } = parsedInput;
    const { userId } = ctx;

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          productUrl: productUrl || null,
          imageUrl: imageUrl || null,
          code: code || null,
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

      return { product: updatedProduct, review };
    });
  });
