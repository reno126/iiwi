"use server";

import { prisma } from "@/lib/db/prisma";
import {
  reconstructRatingsSchema,
  type ReconstructRatingsInput,
} from "@/schemas/product";

export interface ReconstructedProductRating {
  id: string;
  name: string;
  rate_avg: number;
  rate_count: number;
  reviewCount: number;
}

export interface ReconstructRatingsResult {
  success: boolean;
  updatedCount: number;
  products: ReconstructedProductRating[];
  error?: string;
}

export async function reconstructRatings(
  input?: string | ReconstructRatingsInput,
): Promise<ReconstructRatingsResult> {
  const rawId = typeof input === "string" ? input : input?.productId;

  const parsed = reconstructRatingsSchema.safeParse({
    productId: rawId?.trim() ? rawId.trim() : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      updatedCount: 0,
      products: [],
      error: "Nieprawidłowe dane wejściowe.",
    };
  }

  const targetProductId = parsed.data.productId;

  const products = await prisma.product.findMany({
    where: targetProductId ? { id: targetProductId } : undefined,
    select: {
      id: true,
      name: true,
      reviews: {
        select: {
          rate: true,
        },
      },
    },
  });

  if (targetProductId && products.length === 0) {
    return {
      success: false,
      updatedCount: 0,
      products: [],
      error: `Produkt o id "${targetProductId}" nie został znaleziony.`,
    };
  }

  const updates: ReconstructedProductRating[] = [];

  for (const product of products) {
    const reviewCount = product.reviews.length;
    const rate_avg =
      reviewCount > 0
        ? Number(
            (
              product.reviews.reduce((acc, r) => acc + r.rate, 0) / reviewCount
            ).toFixed(2),
          )
        : 0;
    const rate_count = reviewCount;

    updates.push({
      id: product.id,
      name: product.name,
      rate_avg,
      rate_count,
      reviewCount,
    });
  }

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((item) =>
        prisma.product.update({
          where: { id: item.id },
          data: {
            rate_avg: item.rate_avg,
            rate_count: item.rate_count,
          },
        }),
      ),
    );
  }

  return {
    success: true,
    updatedCount: updates.length,
    products: updates,
  };
}
