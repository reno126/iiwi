import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    shop: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { findShopByUrl } from "@/lib/shops/findShopByUrl";

describe("findShopByUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for null, empty or invalid URL without calling db", async () => {
    expect(await findShopByUrl(null)).toBeNull();
    expect(await findShopByUrl("")).toBeNull();
    expect(await findShopByUrl("not-a-domain")).toBeNull();
    expect(prisma.shop.findMany).not.toHaveBeenCalled();
  });

  it("calls prisma.shop.findMany with hasSome candidates and returns matched shop", async () => {
    const mockShop = {
      id: "shop-me",
      name: "Media Expert",
      logo: "https://example.com/me.png",
      matcherKeys: ["mediaexpert.pl", "mediaexpert"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.shop.findMany).mockResolvedValueOnce([mockShop]);

    const result = await findShopByUrl(
      "https://www.mediaexpert.pl/rowery/hulajnogi/kamikaze-k1"
    );

    expect(result).toEqual({
      id: "shop-me",
      name: "Media Expert",
      logo: "https://example.com/me.png",
    });

    expect(prisma.shop.findMany).toHaveBeenCalledWith({
      where: {
        matcherKeys: {
          hasSome: ["mediaexpert.pl", "mediaexpert"],
        },
      },
      select: {
        id: true,
        name: true,
        logo: true,
        matcherKeys: true,
      },
    });
  });

  it("returns null if no shops match the candidates", async () => {
    vi.mocked(prisma.shop.findMany).mockResolvedValueOnce([]);

    const result = await findShopByUrl("https://nieznanysklep12345.pl/p/1");

    expect(result).toBeNull();
  });

  it("performs tie-breaking and selects the shop with the highest-priority match", async () => {
    const shopGeneric = {
      id: "shop-generic",
      name: "Action General",
      logo: null,
      matcherKeys: ["action"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const shopSpecific = {
      id: "shop-specific",
      name: "Action Official",
      logo: "https://example.com/action.svg",
      matcherKeys: ["action.com", "action"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.shop.findMany).mockResolvedValueOnce([
      shopGeneric,
      shopSpecific,
    ]);

    const result = await findShopByUrl("https://www.action.com/pl-pl/p/123");

    expect(result).toEqual({
      id: "shop-specific",
      name: "Action Official",
      logo: "https://example.com/action.svg",
    });
  });
});
