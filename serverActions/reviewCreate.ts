"use server";

import { revalidatePath } from "next/cache";
import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";
import {
  updateProductRating,
  withProductRatingLock,
} from "@/lib/reviews/productRatings";
import {
  reviewCreateSchema,
  reviewCreatedOutputSchema,
  type ReviewCreatedOutput,
} from "@/schemas/review";

export const reviewCreate = safeActionUserCtx
  .inputSchema(reviewCreateSchema)
  .outputSchema(reviewCreatedOutputSchema)
  .action(async ({ parsedInput, ctx }): Promise<ReviewCreatedOutput> => {
    const { productId, rate, description } = parsedInput;
    const { userId } = ctx;

    const createdReview = await withProductRatingLock(
      productId,
      async (transaction) => {
        const review = await transaction.review.create({
          data: {
            productId,
            rate,
            description,
            userId,
          },
        });

        await updateProductRating(transaction, productId);

        return review;
      },
    );

    const responsePayload: ReviewCreatedOutput = {
      id: createdReview.id,
      productId: createdReview.productId,
      rate: createdReview.rate,
      description: createdReview.description,
      userId: createdReview.userId,
      createdAt: createdReview.createdAt,
    };

    try {
      revalidatePath(`/produkty/${productId}`);
      revalidatePath("/produkty");
    } catch {
      return responsePayload;
    }

    return responsePayload;
  });
