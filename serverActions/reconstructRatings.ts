"use server";

import { prisma } from "@/lib/db/prisma";
import {
  reconstructRatingsSchema,
  type ReconstructRatingsInput,
} from "@/schemas/product";

export interface ReconstructedProductRating {
  id: string;
  name: string;
  mid_rate: number | null;
  reviewCount: number;
}

export interface ReconstructRatingsResult {
  success: boolean;
  updatedCount: number;
  products: ReconstructedProductRating[];
  error?: string;
}

/**
 * Reconstructs the `mid_rate` for products based on the `rate` field of their associated reviews.
 * If a `productId` is provided, the calculation runs only for that product.
 * If not provided (or undefined), it recalculates `mid_rate` for all products in the database.
 */
export async function reconstructRatings(
  input?: string | ReconstructRatingsInput,
): Promise<ReconstructRatingsResult> {
  const rawId =
    typeof input === "string" ? input : input?.productId;

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

  // Retrieve products and their reviews' rates
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
    const mid_rate =
      reviewCount > 0
        ? Number(
            (
              product.reviews.reduce((acc, r) => acc + r.rate, 0) / reviewCount
            ).toFixed(2),
          )
        : null;

    updates.push({
      id: product.id,
      name: product.name,
      mid_rate,
      reviewCount,
    });
  }

  // Update each product row in the database
  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((item) =>
        prisma.product.update({
          where: { id: item.id },
          data: { mid_rate: item.mid_rate },
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
