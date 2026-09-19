import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/helper", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth/helper";
import { prisma } from "@/lib/db/prisma";
import { userDashboardGet } from "@/serverActions/userDashboardGet";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";

describe("serverActions/userDashboardGet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when user is not authenticated and no userId is provided", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const result = await userDashboardGet();

    expect(result).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns null when user is not found in the database", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "non-existent-user" },
      expires: "2099-01-01",
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const result = await userDashboardGet();

    expect(result).toBeNull();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "non-existent-user" },
      select: expect.any(Object),
    });
  });

  it("returns aggregated dashboard data and averages ratings for duplicate products", async () => {
    const mockCreatedDate = new Date("2026-01-15T12:00:00.000Z");
    const mockUserFromDb = {
      id: "user-123",
      name: "Krzysztof",
      email: "krzys@example.com",
      createdAt: mockCreatedDate,
      reviews: [
        {
          id: "rev-1",
          rate: 5,
          createdAt: new Date("2026-02-04"),
          product: {
            id: "prod-1",
            name: "Ekspres DeLonghi",
            shop: { name: "Media Expert" },
          },
        },
        {
          id: "rev-2",
          rate: 3,
          createdAt: new Date("2026-02-03"),
          product: {
            id: "prod-1",
            name: "Ekspres DeLonghi",
            shop: { name: "Media Expert" },
          },
        },
        {
          id: "rev-3",
          rate: 4.5,
          createdAt: new Date("2026-02-02"),
          product: {
            id: "prod-2",
            name: "Słuchawki Sony",
            shop: { name: "Allegro" },
          },
        },
        {
          id: "rev-4",
          rate: 5,
          createdAt: new Date("2026-02-01"),
          product: {
            id: "prod-3",
            name: "Myszka Logitech",
            shop: null,
          },
        },
      ],
    };

    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-123" },
      expires: "2099-01-01",
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      mockUserFromDb as never,
    );

    const result = await userDashboardGet();

    expect(result).not.toBeNull();
    expect(result?.user).toEqual({
      name: "Krzysztof",
      email: "krzys@example.com",
      createdAt: mockCreatedDate,
    });
    expect(result?.totalReviewedProducts).toBe(3);
    expect(result?.reviewedProducts).toHaveLength(3);
    expect(result?.reviewedProducts[0]).toEqual({
      productId: "prod-1",
      productName: "Ekspres DeLonghi",
      rate: 4,
      userReviewsCount: 2,
    });
    expect(result?.reviewedProducts[1]).toEqual({
      productId: "prod-2",
      productName: "Słuchawki Sony",
      rate: 4.5,
      userReviewsCount: 1,
    });
    expect(result?.reviewedProducts[2]).toEqual({
      productId: "prod-3",
      productName: "Myszka Logitech",
      rate: 5,
      userReviewsCount: 1,
    });
    expect(result?.reviewedShops).toEqual([
      { shopName: "Media Expert", reviewCount: 2 },
      { shopName: "Allegro", reviewCount: 1 },
      { shopName: DASHBOARD_MESSAGES.fallbackShopName, reviewCount: 1 },
    ]);
  });

  it("handles user with zero reviews correctly", async () => {
    const mockCreatedDate = new Date("2026-03-01T10:00:00.000Z");
    const mockUserWithoutReviews = {
      id: "user-empty",
      name: null,
      email: "nowy@example.com",
      createdAt: mockCreatedDate,
      reviews: [],
    };

    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-empty" },
      expires: "2099-01-01",
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      mockUserWithoutReviews as never,
    );

    const result = await userDashboardGet();

    expect(result).not.toBeNull();
    expect(result?.user.name).toBeNull();
    expect(result?.user.email).toBe("nowy@example.com");
    expect(result?.totalReviewedProducts).toBe(0);
    expect(result?.reviewedProducts).toEqual([]);
    expect(result?.reviewedShops).toEqual([]);
  });

  it("supports passing targetUserId directly without active session", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "explicit-user-id",
      name: "Anna",
      email: "anna@example.com",
      createdAt: new Date("2026-01-01"),
      reviews: [],
    } as never);

    const result = await userDashboardGet("explicit-user-id");

    expect(result).not.toBeNull();
    expect(result?.user.email).toBe("anna@example.com");
  });
});
