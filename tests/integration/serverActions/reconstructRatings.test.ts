import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      update: vi.fn((args) => args),
    },
    $transaction: vi.fn(async (args) => args),
  },
}));

import { prisma } from "@/lib/db/prisma";
import { reconstructRatings } from "@/serverActions/reconstructRatings";

describe("serverActions/reconstructRatings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reconstructs ratings for all products when no input is provided", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Produkt z dwoma opiniami",
        reviews: [{ rate: 5 }, { rate: 4 }],
      },
      {
        id: "prod-2",
        name: "Produkt bez opinii",
        reviews: [],
      },
    ];

    vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockProducts as never);

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
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("reconstructs ratings for a single product when productId string is passed", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Produkt Testowy",
        reviews: [{ rate: 4 }, { rate: 5 }, { rate: 5 }],
      },
    ];

    vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockProducts as never);

    const result = await reconstructRatings("prod-1");

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      select: {
        id: true,
        name: true,
        reviews: {
          select: {
            rate: true,
          },
        },
      },
    });

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(1);
    expect(result.products[0].rate_avg).toBe(4.67);
  });

  it("reconstructs ratings when an object with productId is passed", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Produkt Obiekt",
        reviews: [{ rate: 3 }],
      },
    ];

    vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockProducts as never);

    const result = await reconstructRatings({ productId: "prod-1" });

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(1);
    expect(result.products[0].rate_avg).toBe(3);
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
