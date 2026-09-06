import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma db
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
    expect(result).toEqual([]);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("returns an empty array when query is empty or whitespace", async () => {
    const result = await productSearch("   ");
    expect(result).toEqual([]);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("queries prisma with case-insensitive search by name and code when query is at least 3 characters", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Słuchawki bezprzewodowe",
        code: "SLU-01",
        creatorId: "user-1",
        productUrl: null,
        imageUrl: null,
        rate_avg: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockProducts);

    const result = await productSearch("słuchawki");

    expect(result).toEqual(mockProducts);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: "słuchawki", mode: "insensitive" } },
          { code: { contains: "słuchawki", mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
  });
});
