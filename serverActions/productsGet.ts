"use server";

import { prisma } from "@/lib/db/prisma";

export interface ProductListItem {
  id: string;
  name: string;
  code: string | null;
  imageUrl: string | null;
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
      totalReviews > 0
        ? Number(
            (
              p.reviews.reduce((acc, r) => acc + r.rate, 0) / totalReviews
            ).toFixed(1),
          )
        : null;

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
      _count: {
        reviews: p._count.reviews,
      },
      averageRate,
    };
  });
}
