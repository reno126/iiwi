import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDatabase } = vi.hoisted(() => ({
  mockDatabase: {
    $queryRaw: vi.fn(),
    product: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    review: {
      aggregate: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    ...mockDatabase,
    $transaction: vi.fn(
      async (operation: (transaction: typeof mockDatabase) => unknown) =>
        operation(mockDatabase),
    ),
  },
}));

import { prisma } from "@/lib/db/prisma";
import {
  reconstructRatings,
  RECONSTRUCT_RATINGS_MESSAGES,
} from "@/serverActions/reconstructRatings";

describe("serverActions/reconstructRatings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks execution and returns an error when running in production mode", async () => {
    vi.stubEnv("NODE_ENV", "production");

    try {
      const result = await reconstructRatings();

      expect(result.success).toBe(false);
      expect(result.updatedCount).toBe(0);
      expect(result.products).toEqual([]);
      expect(result.error).toBe(RECONSTRUCT_RATINGS_MESSAGES.onlyInDevelopment);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("reconstructs ratings for all products when no input is provided", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Produkt z dwoma opiniami",
      },
      {
        id: "prod-2",
        name: "Produkt bez opinii",
      },
    ];

    mockDatabase.product.findMany.mockResolvedValueOnce(mockProducts);
    mockDatabase.review.aggregate
      .mockResolvedValueOnce({ _avg: { rate: 4.5 }, _count: { rate: 2 } })
      .mockResolvedValueOnce({ _avg: { rate: null }, _count: { rate: 0 } });
    mockDatabase.product.update
      .mockResolvedValueOnce({
        ...mockProducts[0],
        rate_avg: 4.5,
        rate_count: 2,
      })
      .mockResolvedValueOnce({
        ...mockProducts[1],
        rate_avg: 0,
        rate_count: 0,
      });

    const result = await reconstructRatings();

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(2);
    expect(result.products).toEqual([
      {
        id: "prod-1",
        name: "Produkt z dwoma opiniami",
        rate_avg: 4.5,
        rate_count: 2,
        reviewCount: 2,
      },
      {
        id: "prod-2",
        name: "Produkt bez opinii",
        rate_avg: 0,
        rate_count: 0,
        reviewCount: 0,
      },
    ]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(mockDatabase.product.update).toHaveBeenCalledWith({
      where: { id: "prod-2" },
      data: { rate_avg: 0, rate_count: 0 },
    });
  });

  it("reconstructs ratings for a single product when productId string is passed", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Produkt Testowy",
      },
    ];

    mockDatabase.product.findMany.mockResolvedValueOnce(mockProducts);
    mockDatabase.review.aggregate.mockResolvedValueOnce({
      _avg: { rate: 14 / 3 },
      _count: { rate: 3 },
    });
    mockDatabase.product.update.mockResolvedValueOnce({
      ...mockProducts[0],
      rate_avg: 4.67,
      rate_count: 3,
    });

    const result = await reconstructRatings("prod-1");

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      select: {
        id: true,
      },
    });

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(1);
    expect(result.products[0]?.rate_avg).toBe(4.67);
    expect(mockDatabase.product.update).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { rate_avg: 4.67, rate_count: 3 },
    });
  });

  it("reconstructs ratings when an object with productId is passed", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Produkt Obiekt",
      },
    ];

    mockDatabase.product.findMany.mockResolvedValueOnce(mockProducts);
    mockDatabase.review.aggregate.mockResolvedValueOnce({
      _avg: { rate: 3 },
      _count: { rate: 1 },
    });
    mockDatabase.product.update.mockResolvedValueOnce({
      ...mockProducts[0],
      rate_avg: 3,
      rate_count: 1,
    });

    const result = await reconstructRatings({ productId: "prod-1" });

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(1);
    expect(result.products[0]?.rate_avg).toBe(3);
  });

  it("returns error when targetProductId is not found", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const result = await reconstructRatings("missing-prod");

    expect(result.success).toBe(false);
    expect(result.updatedCount).toBe(0);
    expect(result.products).toEqual([]);
    expect(result.error).toContain("missing-prod");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns success with updatedCount 0 when no products exist in the database", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const result = await reconstructRatings();

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(0);
    expect(result.products).toEqual([]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
