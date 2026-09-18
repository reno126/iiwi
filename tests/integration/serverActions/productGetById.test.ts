import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { productGetById } from "@/serverActions/productGetById";

describe("serverActions/productGetById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when id is empty or whitespace without querying prisma", async () => {
    expect(await productGetById("")).toBeNull();
    expect(await productGetById("   ")).toBeNull();
    expect(prisma.product.findUnique).not.toHaveBeenCalled();
  });

  it("trims whitespace from id and calls findUnique with the trimmed value", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    await productGetById("  prod-123  ");

    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: "prod-123" },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });
  });

  it("returns null when product is not found in the database", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

    const result = await productGetById("non-existent-id");
    expect(result).toBeNull();
  });

  it("returns product with calculated averageRate and review count when product has ratings", async () => {
    const mockProductFromDb = {
      id: "prod-1",
      name: "Słuchawki Sony WH-1000XM5",
      productUrl: "https://sony.com/headphones",
      imageUrl: "https://sony.com/img.jpg",
      code: "SONY-01",
      creatorId: "user-1",
      shopId: "shop-1",
      rate_avg: 4.67,
      rate_count: 3,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      creator: {
        id: "user-1",
        name: "Jan Kowalski",
        email: "jan@example.com",
      },
      reviews: [
        {
          id: "rev-1",
          description: "Świetne słuchawki",
          rate: 5,
          likes: 2,
          productId: "prod-1",
          userId: "user-2",
          createdAt: new Date("2026-01-02"),
          updatedAt: new Date("2026-01-02"),
          user: {
            id: "user-2",
            name: "Anna Nowak",
            email: "anna@example.com",
            image: "https://example.com/avatar.jpg",
          },
        },
      ],
      _count: {
        reviews: 3,
      },
    };

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(mockProductFromDb as never);

    const result = await productGetById("prod-1");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("prod-1");
    expect(result?.name).toBe("Słuchawki Sony WH-1000XM5");
    expect(result?.averageRate).toBe(4.67);
    expect(result?._count.reviews).toBe(3);
    expect(result?.reviews).toHaveLength(1);
    expect(result?.reviews[0].user.name).toBe("Anna Nowak");
  });

  it("returns null averageRate and 0 reviews count when rate_count is 0", async () => {
    const mockProductWithoutReviews = {
      id: "prod-empty",
      name: "Nowy Produkt Bez Opinii",
      productUrl: null,
      imageUrl: null,
      code: null,
      creatorId: "user-1",
      shopId: null,
      rate_avg: 0,
      rate_count: 0,
      createdAt: new Date("2026-02-01"),
      updatedAt: new Date("2026-02-01"),
      creator: {
        id: "user-1",
        name: "Jan Kowalski",
        email: "jan@example.com",
      },
      reviews: [],
      _count: {
        reviews: 0,
      },
    };

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(mockProductWithoutReviews as never);

    const result = await productGetById("prod-empty");

    expect(result).not.toBeNull();
    expect(result?.averageRate).toBeNull();
    expect(result?._count.reviews).toBe(0);
    expect(result?.reviews).toEqual([]);
  });
});
