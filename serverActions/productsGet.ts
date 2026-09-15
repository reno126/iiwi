"use server";

import { prisma } from "@/lib/db/prisma";
import { getCachedProductCount } from "@/lib/db/cachedCounters";

export interface ProductListItem {
  id: string;
  name: string;
  code: string | null;
  imageUrl: string | null;
  rate_avg: number;
  rate_count: number;
  createdAt: Date;
  shop: {
    name: string | null;
  } | null;
}

export interface PaginatedProductsResult {
  products: ProductListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function productsGet({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedProductsResult> {
  const currentPage = Math.max(1, page);
  const skip = (currentPage - 1) * pageSize;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      relationLoadStrategy: "join",
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        code: true,
        imageUrl: true,
        rate_avg: true,
        rate_count: true,
        createdAt: true,
        shop: {
          select: {
            name: true,
          },
        },
      },
    }),
    getCachedProductCount(),
  ]);

  return {
    products,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    currentPage,
    pageSize,
  };
}
