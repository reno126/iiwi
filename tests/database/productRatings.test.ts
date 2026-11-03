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
import { applicationName, controlPool, database } from "./helpers/database";

vi.mock("@/lib/db/prisma", async () => {
  const { database } = await import("./helpers/database");
  return { prisma: database };
});

vi.mock("@/lib/auth/helper", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));

import { auth } from "@/lib/auth/helper";
import {
  updateProductRating,
  withProductRatingLock,
} from "@/lib/reviews/productRatings";
import { reconstructRatings } from "@/serverActions/reconstructRatings";
import { reviewCreate } from "@/serverActions/reviewCreate";
import { productWithReviewCreate } from "@/serverActions/productWithReviewCreate";

let userId: string;
let productId: string;

async function expectAccurateTotals(targetProductId: string) {
  const product = await database.product.findUniqueOrThrow({
    where: { id: targetProductId },
  });
  const totals = await database.review.aggregate({
    where: { productId: targetProductId },
    _avg: { rate: true },
    _count: { rate: true },
  });

  expect(product.rate_count).toBe(totals._count.rate);
  expect(product.rate_avg).toBe(Number((totals._avg.rate ?? 0).toFixed(2)));
  return product;
}

async function submitReview(rate: number) {
  const result = await reviewCreate({
    productId,
    rate,
    description: "Concurrent review regression test",
  });
  expect(result?.serverError).toBeUndefined();
  expect(result?.validationErrors).toBeUndefined();
  expect(result?.data).toMatchObject({ productId, userId, rate });
}

async function runContendingOperations(
  operationCount: number,
  startOperations: () => Promise<unknown>,
) {
  const blocker = await controlPool.connect();
  let completedOperations: Promise<PromiseSettledResult<unknown>[]> | undefined;

  try {
    await blocker.query("BEGIN");
    await blocker.query(
      'SELECT "id" FROM "Product" WHERE "id" = $1 FOR NO KEY UPDATE',
      [productId],
    );
    completedOperations = Promise.allSettled([startOperations()]);

    await expect
      .poll(
        async () => {
          const waiting = await controlPool.query<{ count: number }>(
            "SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE application_name = $1 AND wait_event_type = 'Lock'",
            [applicationName],
          );
          return waiting.rows[0]?.count;
        },
        { timeout: 3000, interval: 20 },
      )
      .toBe(operationCount);
  } finally {
    await blocker.query("ROLLBACK");
    blocker.release();
    const outcomes = await completedOperations;
    for (const outcome of outcomes ?? []) {
      if (outcome.status === "rejected") {
        throw outcome.reason;
      }
    }
  }
}

describe("PostgreSQL product rating consistency", () => {
  beforeEach(async () => {
    userId = randomUUID();
    productId = randomUUID();
    await database.user.create({
      data: { id: userId, email: `${userId}@ratings-test.invalid` },
    });
    await database.product.create({
      data: {
        id: productId,
        name: "Rating concurrency fixture",
        creatorId: userId,
        rate_avg: 0,
        rate_count: 0,
      },
    });
    vi.mocked(auth).mockResolvedValue({
      user: { id: userId },
      expires: "9999-12-31",
    });
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { id: userId } });
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await database.$disconnect();
    await controlPool.end();
  });

  it.each([
    { existingRates: [], submittedRates: [1, 5] },
    { existingRates: [4, 5, 5], submittedRates: [1, 2, 3, 4, 5] },
  ])(
    "preserves totals for simultaneous submissions: %j",
    async ({ existingRates, submittedRates }) => {
      for (const rate of existingRates) {
        await submitReview(rate);
      }

      await runContendingOperations(submittedRates.length, () =>
        Promise.all(submittedRates.map(submitReview)),
      );

      const product = await expectAccurateTotals(productId);
      expect(product.rate_count).toBe(
        existingRates.length + submittedRates.length,
      );
    },
  );

  it("keeps repairs consistent with concurrent review submissions", async () => {
    await submitReview(5);

    await runContendingOperations(3, () =>
      Promise.all([
        submitReview(1),
        submitReview(3),
        reconstructRatings({ productId }).then((result) => {
          expect(result.success).toBe(true);
        }),
      ]),
    );

    const product = await expectAccurateTotals(productId);
    expect(product.rate_count).toBe(3);
    expect(product.rate_avg).toBe(3);
  });

  it("rolls back the review and totals together when a transaction fails", async () => {
    await submitReview(5);
    const failure = new Error("Abort rating transaction");

    await expect(
      withProductRatingLock(productId, async (transaction) => {
        await transaction.review.create({
          data: {
            productId,
            userId,
            rate: 1,
            description: "Rolled back review",
          },
        });
        await updateProductRating(transaction, productId);
        throw failure;
      }),
    ).rejects.toBe(failure);

    const product = await expectAccurateTotals(productId);
    expect(product.rate_count).toBe(1);
    expect(product.rate_avg).toBe(5);
    await submitReview(1);
    expect((await expectAccurateTotals(productId)).rate_count).toBe(2);
  });

  it("repairs stale totals for a product with no reviews", async () => {
    await database.product.update({
      where: { id: productId },
      data: { rate_avg: 5, rate_count: 10 },
    });

    expect((await reconstructRatings(productId)).success).toBe(true);
    const product = await expectAccurateTotals(productId);
    expect(product.rate_count).toBe(0);
    expect(product.rate_avg).toBe(0);
  });

  it("initializes consistent totals when a product and its first review are created together", async () => {
    const result = await productWithReviewCreate({
      name: "New reviewed product",
      rate: 4.5,
      description: "Initial review regression test",
    });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data).toBeDefined();
    if (!result?.data) {
      throw new Error("Product creation returned no data");
    }
    const product = await expectAccurateTotals(result.data.product.id);
    expect(product.rate_count).toBe(1);
    expect(product.rate_avg).toBe(4.5);
  });
});
