import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { database, controlPool } from "./helpers/database";

vi.mock("@/lib/db/prisma", async () => {
  const { database } = await import("./helpers/database");
  return { prisma: database };
});
vi.mock("@/lib/auth/helper", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth/helper";
import { userDashboardGet } from "@/serverActions/userDashboardGet";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";

describe("PostgreSQL dashboard lifetime totals", () => {
  let userId: string;
  let otherUserId: string;
  let firstShopId: string;
  let secondShopId: string;

  beforeEach(async () => {
    userId = randomUUID();
    otherUserId = randomUUID();
    firstShopId = randomUUID();
    secondShopId = randomUUID();
    await database.user.createMany({
      data: [userId, otherUserId].map((id) => ({
        id,
        email: `${id}@dashboard-test.invalid`,
      })),
    });
    await database.shop.createMany({
      data: [{ id: firstShopId }, { id: secondShopId }],
    });
    vi.mocked(auth).mockResolvedValue({
      user: { id: userId },
      expires: "9999-12-31",
    });
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { id: { in: [userId, otherUserId] } },
    });
    await database.shop.deleteMany({
      where: { id: { in: [firstShopId, secondShopId] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
    await controlPool.end();
  });

  it("includes all 102 reviews across 101 products without mixing users or unnamed shops", async () => {
    const products = Array.from(
      { length: 101 },
      (unusedValue, productIndex) => ({
        id: randomUUID(),
        name: `Dashboard product ${productIndex}`,
        creatorId: userId,
        shopId:
          productIndex < 50
            ? firstShopId
            : productIndex < 100
              ? secondShopId
              : null,
        rate_avg: 0,
        rate_count: 0,
      }),
    );
    const firstProduct = products[0];
    if (!firstProduct) throw new Error("Missing fixture product");
    await database.product.createMany({ data: products });
    await database.review.createMany({
      data: products.map((product, productIndex) => ({
        userId,
        productId: product.id,
        rate: productIndex === 0 ? 1 : 4,
        description: "Lifetime dashboard fixture",
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, productIndex)),
      })),
    });
    await database.review.createMany({
      data: [
        {
          userId,
          productId: firstProduct.id,
          rate: 5,
          description: "Latest review",
          createdAt: new Date("2026-02-01"),
        },
        {
          userId: otherUserId,
          productId: firstProduct.id,
          rate: 1,
          description: "Other user's review",
        },
      ],
    });

    const result = await userDashboardGet();
    const productTotals = await controlPool.query<{
      productId: string;
      productName: string;
      rate: number;
      userReviewsCount: number;
    }>(
      `SELECT product.id AS "productId", product.name AS "productName",
              AVG(review.rate)::float8 AS rate, COUNT(*)::int AS "userReviewsCount"
       FROM "Review" review JOIN "Product" product ON product.id = review.product_id
       WHERE review.user_id = $1
       GROUP BY product.id ORDER BY MAX(review."createdAt") DESC, product.id ASC`,
      [userId],
    );
    const shopTotals = await controlPool.query<{
      shopId: string | null;
      reviewCount: number;
    }>(
      `SELECT product.shop_id AS "shopId", COUNT(*)::int AS "reviewCount"
       FROM "Review" review JOIN "Product" product ON product.id = review.product_id
       WHERE review.user_id = $1 GROUP BY product.shop_id`,
      [userId],
    );

    expect(result?.totalReviewedProducts).toBe(101);
    expect(result?.reviewedProducts).toEqual(productTotals.rows);
    expect(result?.reviewedProducts[0]).toMatchObject({
      productId: firstProduct.id,
      rate: 3,
      userReviewsCount: 2,
    });
    expect(result?.reviewedShops).toHaveLength(3);
    expect(result?.reviewedShops).toEqual(
      expect.arrayContaining(
        shopTotals.rows.map((shop) => ({
          ...shop,
          shopName: DASHBOARD_MESSAGES.fallbackShopName,
        })),
      ),
    );
    expect(result?.reviewedShops.map((shop) => shop.reviewCount)).toEqual([
      51, 50, 1,
    ]);

    expect(await userDashboardGet(otherUserId)).toBeNull();
    vi.mocked(auth).mockResolvedValue({
      user: { id: otherUserId },
      expires: "9999-12-31",
    });
    const otherDashboard = await userDashboardGet();
    expect(otherDashboard?.totalReviewedProducts).toBe(1);
    expect(otherDashboard?.reviewedProducts[0]).toMatchObject({
      rate: 1,
      userReviewsCount: 1,
    });
  });
});
