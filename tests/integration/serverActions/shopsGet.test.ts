import { describe, it, expect, vi, beforeEach } from "vitest";

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
      },
      {
        id: "shop-2",
        name: "Media Expert",
        logo: "https://example.com/me.png",
      },
    ];

    vi.mocked(prisma.shop.findMany).mockResolvedValueOnce(mockShops as never);

    const result = await shopsGet();

    expect(result).toEqual(mockShops);
    expect(prisma.shop.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });
  });
});
