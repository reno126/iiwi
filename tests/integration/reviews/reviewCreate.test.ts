import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth helper before importing server action
vi.mock("@/lib/auth/helper", () => ({
  auth: vi.fn(),
}));

// Mock prisma db
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    review: {
      create: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth/helper";
import { prisma } from "@/lib/db/prisma";
import { reviewCreate } from "@/serverActions/reviewCreate";

describe("serverActions/reviewCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns server error when called without an active authenticated session", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const result = await reviewCreate({
      productId: "prod-123",
      rate: 5,
      description: "Świetny produkt, polecam!",
    });

    expect(result?.serverError).toBeDefined();
    expect(result?.data).toBeUndefined();
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it("returns validation errors when input data fails reviewCreateSchema", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-123", name: "Jan", email: "jan@example.com" },
      expires: "9999-12-31",
    });

    const result = await reviewCreate({
      productId: "",
      rate: 10,
      description: "ab",
    });

    expect(result?.validationErrors).toBeDefined();
    expect(result?.data).toBeUndefined();
    expect(result?.validationErrors?.fieldErrors?.productId).toBeDefined();
    expect(result?.validationErrors?.fieldErrors?.rate).toBeDefined();
    expect(result?.validationErrors?.fieldErrors?.description).toBeDefined();
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it("creates review in database when user is authenticated and input is valid", async () => {
    const mockUser = { id: "user-abc-123", name: "Jan", email: "jan@example.com" };
    vi.mocked(auth).mockResolvedValueOnce({
      user: mockUser,
      expires: "9999-12-31",
    });

    const createdReview = {
      id: "rev-999",
      productId: "prod-123",
      userId: mockUser.id,
      rate: 4.5,
      description: "Bardzo dobry produkt, polecam każdemu.",
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.review.create).mockResolvedValueOnce(createdReview);

    const inputData = {
      productId: "prod-123",
      rate: 4.5,
      description: "Bardzo dobry produkt, polecam każdemu.",
    };

    const result = await reviewCreate(inputData);

    expect(result?.serverError).toBeUndefined();
    expect(result?.validationErrors).toBeUndefined();
    expect(result?.data).toEqual(createdReview);

    expect(prisma.review.create).toHaveBeenCalledWith({
      data: {
        productId: inputData.productId,
        rate: inputData.rate,
        description: inputData.description,
        userId: mockUser.id,
      },
    });
  });
});
