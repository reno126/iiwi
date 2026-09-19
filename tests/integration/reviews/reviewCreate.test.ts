import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/helper", () => ({
  auth: vi.fn(),
}));

const { mockTx } = vi.hoisted(() => {
  return {
    mockTx: {
      review: {
        create: vi.fn(),
        aggregate: vi.fn(),
      },
      product: {
        update: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    ...mockTx,
    $transaction: vi.fn(async (cb: (tx: typeof mockTx) => unknown) =>
      cb(mockTx),
    ),
  },
}));

import { auth } from "@/lib/auth/helper";
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
    expect(mockTx.review.create).not.toHaveBeenCalled();
    expect(mockTx.product.update).not.toHaveBeenCalled();
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
    expect(mockTx.review.create).not.toHaveBeenCalled();
    expect(mockTx.product.update).not.toHaveBeenCalled();
  });

  it("creates review and recalculates rate_avg and rate_count on the fly", async () => {
    const mockUser = {
      id: "user-abc-123",
      name: "Jan",
      email: "jan@example.com",
    };
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

    mockTx.review.create.mockResolvedValueOnce(createdReview);
    mockTx.review.aggregate.mockResolvedValueOnce({
      _avg: { rate: 4.5 },
      _count: { rate: 3 },
    });
    mockTx.product.update.mockResolvedValueOnce({
      id: "prod-123",
      rate_avg: 4.5,
      rate_count: 3,
    });

    const inputData = {
      productId: "prod-123",
      rate: 4.5,
      description: "Bardzo dobry produkt, polecam każdemu.",
    };

    const result = await reviewCreate(inputData);

    expect(result?.serverError).toBeUndefined();
    expect(result?.validationErrors).toBeUndefined();
    expect(result?.data).toEqual(createdReview);

    expect(mockTx.review.create).toHaveBeenCalledWith({
      data: {
        productId: inputData.productId,
        rate: inputData.rate,
        description: inputData.description,
        userId: mockUser.id,
      },
    });

    expect(mockTx.review.aggregate).toHaveBeenCalledWith({
      where: { productId: inputData.productId },
      _avg: { rate: true },
      _count: { rate: true },
    });

    expect(mockTx.product.update).toHaveBeenCalledWith({
      where: { id: inputData.productId },
      data: {
        rate_avg: 4.5,
        rate_count: 3,
      },
    });
  });
});
