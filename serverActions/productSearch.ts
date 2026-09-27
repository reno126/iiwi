"use server";

import { prisma } from "@/lib/db/prisma";
import { publicActionClient } from "@/lib/actions/safeActionClient";
import { productSearchSchema } from "@/schemas/product";

export interface ProductSearchResultItem {
  id: string;
  name: string;
  code: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  rate_avg: number;
  rate_count: number;
  createdAt: Date;
  updatedAt: Date;
  shopId: string | null;
}

export const productSearch = publicActionClient
  .schema(productSearchSchema)
  .action(
    async ({ parsedInput: query }): Promise<ProductSearchResultItem[]> => {
      const trimmed = query.trim();
      if (trimmed.length < 3) {
        return [];
      }

      return await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: trimmed, mode: "insensitive" } },
            { code: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          code: true,
          imageUrl: true,
          productUrl: true,
          rate_avg: true,
          rate_count: true,
          createdAt: true,
          updatedAt: true,
          shopId: true,
        },
      });
    },
  );
