"use server";

import { cache } from "react";
import { auth } from "@/lib/auth/helper";
import { prisma } from "@/lib/db/prisma";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";

export interface UserDashboardProductItem {
  productId: string;
  productName: string;
  rate: number;
  userReviewsCount: number;
}

export interface UserDashboardShopItem {
  shopId: string | null;
  shopName: string;
  reviewCount: number;
}

export interface UserDashboardData {
  user: {
    name: string | null;
    email: string;
    createdAt: Date;
  };
  totalReviewedProducts: number;
  reviewedProducts: UserDashboardProductItem[];
  reviewedShops: UserDashboardShopItem[];
}

function compareShopEntries(
  firstShop: UserDashboardShopItem,
  secondShop: UserDashboardShopItem,
): number {
  if (secondShop.reviewCount !== firstShop.reviewCount) {
    return secondShop.reviewCount - firstShop.reviewCount;
  }
  return (
    firstShop.shopName.localeCompare(secondShop.shopName) ||
    (firstShop.shopId ?? "").localeCompare(secondShop.shopId ?? "")
  );
}

export const userDashboardGet = cache(async function userDashboardGet(
  targetUserId?: string,
): Promise<UserDashboardData | null> {
  const session = await auth();
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return null;
  }

  if (targetUserId && targetUserId !== sessionUserId) {
    return null;
  }

  const userId = sessionUserId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const [reviewGroups, products] = await Promise.all([
    prisma.review.groupBy({
      by: ["productId"],
      where: { userId },
      _avg: { rate: true },
      _count: { _all: true },
      orderBy: [{ _max: { createdAt: "desc" } }, { productId: "asc" }],
    }),
    prisma.product.findMany({
      where: { reviews: { some: { userId } } },
      select: {
        id: true,
        name: true,
        shopId: true,
        shop: { select: { name: true } },
      },
    }),
  ]);

  const productsById = new Map(
    products.map((product) => [product.id, product]),
  );
  const reviewedProducts: UserDashboardProductItem[] = [];
  const shopsById = new Map<string | null, UserDashboardShopItem>();
  for (const reviewGroup of reviewGroups) {
    const product = productsById.get(reviewGroup.productId);
    if (!product) continue;

    const reviewCount = reviewGroup._count._all;
    reviewedProducts.push({
      productId: product.id,
      productName: product.name,
      rate: Math.round((reviewGroup._avg.rate ?? 0) * 10) / 10,
      userReviewsCount: reviewCount,
    });

    const shop = shopsById.get(product.shopId);
    if (shop) {
      shop.reviewCount += reviewCount;
    } else {
      shopsById.set(product.shopId, {
        shopId: product.shopId,
        shopName: product.shop?.name ?? DASHBOARD_MESSAGES.fallbackShopName,
        reviewCount,
      });
    }
  }

  const reviewedShops = Array.from(shopsById.values()).sort(compareShopEntries);

  return {
    user: {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    totalReviewedProducts: reviewedProducts.length,
    reviewedProducts,
    reviewedShops,
  };
});
