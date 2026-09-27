import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { productSearch } from "@/serverActions/productSearch";

describe("serverActions/productSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when query is less than 3 characters", async () => {
    const result = await productSearch("ab");
    expect(result?.data).toEqual([]);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("returns an empty array when query is empty or whitespace", async () => {
    const result = await productSearch("   ");
    expect(result?.data).toEqual([]);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("queries prisma with case-insensitive search by name and code when query is at least 3 characters", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Słuchawki bezprzewodowe",
        code: "SLU-01",
        productUrl: null,
        imageUrl: null,
        shopId: null,
        rate_avg: 0,
        rate_count: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(prisma.product.findMany).mockResolvedValueOnce(
      mockProducts as never,
    );

    const result = await productSearch("słuchawki");

    expect(result?.data).toEqual(mockProducts);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: "słuchawki", mode: "insensitive" } },
          { code: { contains: "słuchawki", mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        code: true,
        imageUrl: true,
        productUrl: true,
        rate_avg: true,
        rate_count: true,
        createdAt: true,
        updatedAt: true,
        shopId: true,
      },
    });
  });
});
