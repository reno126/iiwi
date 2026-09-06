"use server";

import { prisma } from "@/lib/db/prisma";

export interface ProductListItem {
  id: string;
  name: string;
  code: string | null;
  imageUrl: string | null;
  rate_avg: number | null;
  rate_count: number | null;
  createdAt: Date;
  _count: {
    reviews: number;
  };
  averageRate: number | null;
}

export async function productsGet(): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      imageUrl: true,
      rate_avg: true,
      rate_count: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
        },
      },
      reviews: {
        select: {
          rate: true,
        },
      },
    },
  });

  return products.map((p) => {
    const totalReviews = p.reviews.length;
    const averageRate =
      p.rate_avg ??
      (totalReviews > 0
        ? Number(
            (
              p.reviews.reduce((acc, r) => acc + r.rate, 0) / totalReviews
            ).toFixed(1),
          )
        : null);

    const reviewCount = p.rate_count ?? p._count.reviews;

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      imageUrl: p.imageUrl,
      rate_avg: p.rate_avg,
      rate_count: p.rate_count,
      createdAt: p.createdAt,
      _count: {
        reviews: reviewCount,
      },
      averageRate,
    };
  });
}
