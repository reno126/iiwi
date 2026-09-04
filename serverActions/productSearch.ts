"use server";

import { prisma } from "@/lib/db/prisma";

export async function productSearch(query: string) {
  const trimmed = query?.trim() ?? "";
  if (trimmed.length < 3) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { code: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return products;
}
