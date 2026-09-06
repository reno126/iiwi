"use server";

import { prisma } from "@/lib/db/prisma";

export type ProductWithReviews = {
  id: string;
  name: string;
  productUrl: string | null;
  imageUrl: string | null;
  code: string | null;
  creatorId: string;
  rate_avg: number;
  rate_count: number;
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

  const averageRate = product.rate_count > 0 ? product.rate_avg : null;
  const reviewCount = product.rate_count;

  return {
    ...product,
    averageRate,
    _count: {
      reviews: reviewCount,
    },
  };
}
