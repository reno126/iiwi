"use server";

import { prisma } from "@/lib/db/prisma";

export interface ShopItem {
  id: string;
  name: string | null;
  logo: string | null;
}

export async function shopsGet(): Promise<ShopItem[]> {
  return await prisma.shop.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      logo: true,
    },
  });
}
