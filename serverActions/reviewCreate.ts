"use server";

import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";
import { prisma } from "@/lib/db/prisma";
import { reviewCreateSchema } from "@/schemas/review";

export const reviewCreate = safeActionUserCtx
  .inputSchema(reviewCreateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { productId, rate, description } = parsedInput;
    const { userId } = ctx;

    return await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          productId,
          rate,
          description,
          userId,
        },
      });

      const aggregations = await tx.review.aggregate({
        where: { productId },
        _avg: { rate: true },
        _count: { rate: true },
      });

      const rate_avg =
        aggregations._avg.rate !== null
          ? Number(aggregations._avg.rate.toFixed(2))
          : 0;
      const rate_count = aggregations._count.rate;

      await tx.product.update({
        where: { id: productId },
        data: {
          rate_avg,
          rate_count,
        },
      });

      return review;
    });
  });
