import { describe, it, expect, vi, beforeEach } from "vitest";

const { findUser, groupReviews, findProducts } = vi.hoisted(() => ({
  findUser: vi.fn(),
  groupReviews: vi.fn(),
  findProducts: vi.fn(),
}));

vi.mock("@/lib/auth/helper", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: findUser },
    review: { groupBy: groupReviews },
    product: { findMany: findProducts },
  },
}));

import { auth } from "@/lib/auth/helper";
import { userDashboardGet } from "@/serverActions/userDashboardGet";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";

describe("serverActions/userDashboardGet", () => {
  const user = {
    id: "user-1",
    name: "Krzysztof",
    email: "krzys@example.com",
    createdAt: new Date("2026-01-15T12:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id },
      expires: "2099-01-01",
    });
    findUser.mockResolvedValue(user);
    groupReviews.mockResolvedValue([]);
    findProducts.mockResolvedValue([]);
  });

  it("returns null without database access for an unauthenticated caller", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);
    expect(await userDashboardGet()).toBeNull();
    expect(findUser).not.toHaveBeenCalled();
    expect(groupReviews).not.toHaveBeenCalled();
    expect(findProducts).not.toHaveBeenCalled();
  });

  it("returns null when the session user no longer exists", async () => {
    findUser.mockResolvedValueOnce(null);
    expect(await userDashboardGet()).toBeNull();
    expect(groupReviews).not.toHaveBeenCalled();
    expect(findProducts).not.toHaveBeenCalled();
  });

  it("rejects access to another user's dashboard before database access", async () => {
    expect(await userDashboardGet("other-user")).toBeNull();
    expect(findUser).not.toHaveBeenCalled();
    expect(groupReviews).not.toHaveBeenCalled();
    expect(findProducts).not.toHaveBeenCalled();
  });

  it("returns an empty dashboard for a user without reviews", async () => {
    expect(await userDashboardGet()).toEqual({
      user: { name: user.name, email: user.email, createdAt: user.createdAt },
      totalReviewedProducts: 0,
      reviewedProducts: [],
      reviewedShops: [],
    });
  });

  it("uses lifetime product aggregates and keeps shops with matching labels separate", async () => {
    groupReviews.mockResolvedValueOnce([
      { productId: "product-1", _avg: { rate: 4.25 }, _count: { _all: 120 } },
      { productId: "product-2", _avg: { rate: 3 }, _count: { _all: 2 } },
      { productId: "product-3", _avg: { rate: 5 }, _count: { _all: 1 } },
    ]);
    findProducts.mockResolvedValueOnce([
      { id: "product-3", name: "Mouse", shopId: null, shop: null },
      {
        id: "product-2",
        name: "Keyboard",
        shopId: "shop-2",
        shop: { name: null },
      },
      {
        id: "product-1",
        name: "Screen",
        shopId: "shop-1",
        shop: { name: null },
      },
    ]);

    const result = await userDashboardGet();

    expect(result?.totalReviewedProducts).toBe(3);
    expect(result?.reviewedProducts).toEqual([
      {
        productId: "product-1",
        productName: "Screen",
        rate: 4.3,
        userReviewsCount: 120,
      },
      {
        productId: "product-2",
        productName: "Keyboard",
        rate: 3,
        userReviewsCount: 2,
      },
      {
        productId: "product-3",
        productName: "Mouse",
        rate: 5,
        userReviewsCount: 1,
      },
    ]);
    expect(result?.reviewedShops).toEqual([
      {
        shopId: "shop-1",
        shopName: DASHBOARD_MESSAGES.fallbackShopName,
        reviewCount: 120,
      },
      {
        shopId: "shop-2",
        shopName: DASHBOARD_MESSAGES.fallbackShopName,
        reviewCount: 2,
      },
      {
        shopId: null,
        shopName: DASHBOARD_MESSAGES.fallbackShopName,
        reviewCount: 1,
      },
    ]);
  });
});
