import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/prisma/generated/client";

export async function withProductRatingLock<Result>(
  productId: string,
  operation: (transaction: Prisma.TransactionClient) => Promise<Result>,
): Promise<Result> {
  return prisma.$transaction(
    async (transaction) => {
      await transaction.$queryRaw`
        SELECT "id" FROM "Product" WHERE "id" = ${productId} FOR UPDATE
      `;

      return operation(transaction);
    },
    { isolationLevel: "ReadCommitted" },
  );
}

export async function updateProductRating(
  transaction: Prisma.TransactionClient,
  productId: string,
) {
  const aggregations = await transaction.review.aggregate({
    where: { productId },
    _avg: { rate: true },
    _count: { rate: true },
  });

  return transaction.product.update({
    where: { id: productId },
    data: {
      rate_avg: Number((aggregations._avg.rate ?? 0).toFixed(2)),
      rate_count: aggregations._count.rate,
    },
  });
}
