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

interface ProductAccumulator {
  productId: string;
  productName: string;
  rates: number[];
}

function aggregateProductReviews(
  reviews: Array<{
    id: string;
    rate: number;
    product: {
      id: string;
      name: string;
    };
  }>,
): UserDashboardProductItem[] {
  const productsMap = new Map<string, ProductAccumulator>();

  for (const review of reviews) {
    const existing = productsMap.get(review.product.id);
    if (existing) {
      existing.rates.push(review.rate);
    } else {
      productsMap.set(review.product.id, {
        productId: review.product.id,
        productName: review.product.name,
        rates: [review.rate],
      });
    }
  }

  return Array.from(productsMap.values()).map((entry) => {
    const totalRate = entry.rates.reduce((sum, r) => sum + r, 0);
    const averageRate = totalRate / entry.rates.length;
    const roundedRate = Math.round(averageRate * 10) / 10;

    return {
      productId: entry.productId,
      productName: entry.productName,
      rate: roundedRate,
      userReviewsCount: entry.rates.length,
    };
  });
}

function compareShopEntries(
  a: UserDashboardShopItem,
  b: UserDashboardShopItem,
): number {
  if (b.reviewCount !== a.reviewCount) {
    return b.reviewCount - a.reviewCount;
  }
  return a.shopName.localeCompare(b.shopName);
}

export const userDashboardGet = cache(async function userDashboardGet(
  targetUserId?: string,
): Promise<UserDashboardData | null> {
  const session = await auth();
  const userId = targetUserId ?? session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rate: true,
          product: {
            select: {
              id: true,
              name: true,
              shop: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const reviewedProducts = aggregateProductReviews(user.reviews);
  const totalReviewedProducts = reviewedProducts.length;

  const shopCounts = new Map<string, number>();
  for (const review of user.reviews) {
    const shopName =
      review.product.shop?.name ?? DASHBOARD_MESSAGES.fallbackShopName;
    const currentCount = shopCounts.get(shopName) ?? 0;
    shopCounts.set(shopName, currentCount + 1);
  }

  const reviewedShops: UserDashboardShopItem[] = Array.from(
    shopCounts.entries(),
  )
    .map(([shopName, reviewCount]) => ({
      shopName,
      reviewCount,
    }))
    .sort(compareShopEntries);

  return {
    user: {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    totalReviewedProducts,
    reviewedProducts,
    reviewedShops,
  };
});
