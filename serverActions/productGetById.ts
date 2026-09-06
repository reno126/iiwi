"use server";

import { prisma } from "@/lib/db/prisma";

export type ProductWithReviews = {
  id: string;
  name: string;
  productUrl: string | null;
  imageUrl: string | null;
  code: string | null;
  creatorId: string;
  rate_avg: number | null;
  rate_count: number | null;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
  reviews: {
    id: string;
    description: string;
    rate: number;
    likes: number;
    productId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }[];
  _count: {
    reviews: number;
  };
  averageRate: number | null;
};

export async function productGetById(
  id: string,
): Promise<ProductWithReviews | null> {
  const trimmedId = id?.trim();
  if (!trimmedId) {
    return null;
  }

  const product = await prisma.product.findUnique({
    where: { id: trimmedId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const totalReviews = product.reviews.length;
  const averageRate =
    product.rate_avg ??
    (totalReviews > 0
      ? Number(
          (
            product.reviews.reduce((acc, r) => acc + r.rate, 0) / totalReviews
          ).toFixed(1),
        )
      : null);

  const reviewCount = product.rate_count ?? product._count.reviews;

  return {
    ...product,
    averageRate,
    _count: {
      reviews: reviewCount,
    },
  };
}
