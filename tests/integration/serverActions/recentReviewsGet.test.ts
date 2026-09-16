import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    review: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { recentReviewsGet } from "@/serverActions/recentReviewsGet";

describe("serverActions/recentReviewsGet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReviews = [
    {
      id: "rev-1",
      description: "Bardzo dobry produkt",
      rate: 5,
      createdAt: new Date("2026-03-10"),
      user: {
        name: "Piotr",
      },
      product: {
        id: "prod-1",
        name: "Konsola do gier",
        code: "KONS-01",
        imageUrl: "https://example.com/konsola.jpg",
        rate_avg: 4.8,
        rate_count: 5,
        shop: {
          name: "RTV Euro AGD",
        },
      },
    },
  ];

  it("fetches recent reviews with default limit of 3", async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce(mockReviews as never);

    const result = await recentReviewsGet();

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      relationLoadStrategy: "join",
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        description: true,
        rate: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            imageUrl: true,
            rate_avg: true,
            rate_count: true,
            shop: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    expect(result).toEqual(mockReviews);
  });

  it("fetches recent reviews with custom limit parameter", async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce(mockReviews as never);

    const result = await recentReviewsGet(10);

    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
      }),
    );
    expect(result).toEqual(mockReviews);
  });
});
