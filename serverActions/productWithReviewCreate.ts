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

      return { product, review };
    });
  });
