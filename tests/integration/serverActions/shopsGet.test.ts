import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma db
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    shop: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { shopsGet } from "@/serverActions/shopsGet";

describe("serverActions/shopsGet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches shops from prisma ordered by name ascending", async () => {
    const mockShops = [
      {
        id: "shop-1",
        name: "Action",
        logo: "https://example.com/action.png",
        matcherKeys: ["action.com", "action"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "shop-2",
        name: "Media Expert",
        logo: "https://example.com/me.png",
        matcherKeys: ["mediaexpert.pl", "mediaexpert"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(prisma.shop.findMany).mockResolvedValueOnce(mockShops);

    const result = await shopsGet();

    expect(result).toEqual(mockShops);
    expect(prisma.shop.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        logo: true,
        matcherKeys: true,
      },
    });
  });
});
