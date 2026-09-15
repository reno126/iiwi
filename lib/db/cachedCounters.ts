import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export const getCachedProductCount = unstable_cache(
  async () => prisma.product.count(),
  ["products-total-count"],
  { revalidate: 3600, tags: ["products-count"] },
);
