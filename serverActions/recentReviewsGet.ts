"use server";

import { prisma } from "@/lib/db/prisma";

export interface RecentReviewItem {
  id: string;
  description: string;
  rate: number;
  createdAt: Date;
  user: {
    name: string | null;
  };
  product: {
    id: string;
    name: string;
    code: string | null;
    imageUrl: string | null;
    rate_avg: number;
    rate_count: number;
    shop: {
      name: string | null;
    } | null;
  };
}

export async function recentReviewsGet(
  limit: number = 3,
): Promise<RecentReviewItem[]> {
  return await prisma.review.findMany({
    relationLoadStrategy: "join",
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      description: true,
      rate: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          code: true,
          imageUrl: true,
          rate_avg: true,
          rate_count: true,
          shop: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}
