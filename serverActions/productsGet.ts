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

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export async function productsGet({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedProductsResult> {
  const currentPage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(
    Math.max(1, Math.floor(pageSize)),
    MAX_PAGE_SIZE,
  );
  const skip = (currentPage - 1) * safePageSize;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      relationLoadStrategy: "join",
      orderBy: { createdAt: "desc" },
      skip,
      take: safePageSize,
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
    totalPages: Math.ceil(totalCount / safePageSize) || 1,
    currentPage,
    pageSize: safePageSize,
  };
}
