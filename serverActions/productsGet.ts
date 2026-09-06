"use server";

import { prisma } from "@/lib/db/prisma";

export interface ProductListItem {
  id: string;
  name: string;
  code: string | null;
  imageUrl: string | null;
  rate_avg: number;
  rate_count: number;
  createdAt: Date;
}

export async function productsGet(): Promise<ProductListItem[]> {
  return await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      imageUrl: true,
      rate_avg: true,
      rate_count: true,
      createdAt: true,
    },
  });
}
