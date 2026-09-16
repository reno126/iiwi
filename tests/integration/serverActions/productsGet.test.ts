import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/cachedCounters", () => ({
  getCachedProductCount: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { getCachedProductCount } from "@/lib/db/cachedCounters";
import { productsGet } from "@/serverActions/productsGet";

describe("serverActions/productsGet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProductsList = [
    {
      id: "prod-1",
      name: "Produkt 1",
      code: "P-01",
      imageUrl: "https://example.com/p1.jpg",
      rate_avg: 4.5,
      rate_count: 10,
      createdAt: new Date("2026-03-01"),
      shop: { name: "Media Markt" },
    },
    {
      id: "prod-2",
      name: "Produkt 2",
      code: "P-02",
      imageUrl: null,
      rate_avg: 0,
      rate_count: 0,
      createdAt: new Date("2026-03-02"),
      shop: null,
    },
  ];

  it("fetches first page with default page (1) and pageSize (20)", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockProductsList as never);
    vi.mocked(getCachedProductCount).mockResolvedValueOnce(45);

    const result = await productsGet();

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      relationLoadStrategy: "join",
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 20,
      select: {
        id: true,
        name: true,
        code: true,
        imageUrl: true,
        rate_avg: true,
        rate_count: true,
        createdAt: true,
        shop: {
          select: {
            name: true,
          },
        },
      },
    });
    expect(getCachedProductCount).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      products: mockProductsList,
      totalCount: 45,
      totalPages: 3,
      currentPage: 1,
      pageSize: 20,
    });
  });

  it("applies custom page and pageSize with correct skip and take offsets", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockProductsList as never);
    vi.mocked(getCachedProductCount).mockResolvedValueOnce(50);

    const result = await productsGet({ page: 3, pageSize: 15 });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 30,
        take: 15,
      }),
    );

    expect(result.currentPage).toBe(3);
    expect(result.pageSize).toBe(15);
    expect(result.totalCount).toBe(50);
    expect(result.totalPages).toBe(4);
  });

  it("normalizes negative or zero page number to 1", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);
    vi.mocked(getCachedProductCount).mockResolvedValueOnce(10);

    const resultZero = await productsGet({ page: 0, pageSize: 10 });
    expect(resultZero.currentPage).toBe(1);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );

    const resultNegative = await productsGet({ page: -5, pageSize: 10 });
    expect(resultNegative.currentPage).toBe(1);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
  });

  it("returns totalPages as 1 when totalCount is 0", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);
    vi.mocked(getCachedProductCount).mockResolvedValueOnce(0);

    const result = await productsGet();

    expect(result).toEqual({
      products: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: 20,
    });
  });

  it("handles exact divisibility for totalPages calculation", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);
    vi.mocked(getCachedProductCount).mockResolvedValueOnce(40);

    const result = await productsGet({ page: 1, pageSize: 20 });

    expect(result.totalPages).toBe(2);
  });
});
