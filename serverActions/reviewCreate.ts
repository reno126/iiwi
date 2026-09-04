"use server";

import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";
import { prisma } from "@/lib/db/prisma";
import { reviewCreateSchema } from "@/schemas/review";

export const reviewCreate = safeActionUserCtx
  .inputSchema(reviewCreateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { productId, rate, description } = parsedInput;
    const { userId } = ctx;

    const review = await prisma.review.create({
      data: {
        productId,
        rate,
        description,
        userId,
      },
    });

    return review;
  });
