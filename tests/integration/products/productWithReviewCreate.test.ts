import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/helper", () => ({
  auth: vi.fn(),
}));

const { mockTx } = vi.hoisted(() => {
  return {
    mockTx: {
      product: {
        create: vi.fn(),
        update: vi.fn(),
      },
      review: {
        create: vi.fn(),
        aggregate: vi.fn(),
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
import { productWithReviewCreate } from "@/serverActions/productWithReviewCreate";

describe("serverActions/productWithReviewCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns server error when called without an active authenticated session", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const result = await productWithReviewCreate({
      name: "Nowy produkt testowy",
      rate: 5,
      description: "Świetny produkt, polecam!",
    });

    expect(result?.serverError).toBeDefined();
    expect(result?.data).toBeUndefined();
    expect(mockTx.product.create).not.toHaveBeenCalled();
    expect(mockTx.review.create).not.toHaveBeenCalled();
  });

  it("returns validation errors when input data fails productWithReviewCreateSchema", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-123", name: "Jan", email: "jan@example.com" },
      expires: "9999-12-31",
    });

    const result = await productWithReviewCreate({
      name: "AB",
      rate: 6,
      description: "ok",
    });

    expect(result?.validationErrors).toBeDefined();
    expect(result?.data).toBeUndefined();
    expect(result?.validationErrors?.fieldErrors?.name).toBeDefined();
    expect(result?.validationErrors?.fieldErrors?.rate).toBeDefined();
    expect(result?.validationErrors?.fieldErrors?.description).toBeDefined();
    expect(mockTx.product.create).not.toHaveBeenCalled();
  });

  it("calculates rate_avg and rate_count on the fly via review aggregation and updates product", async () => {
    const mockUser = {
      id: "user-abc-123",
      name: "Jan",
      email: "jan@example.com",
    };
    vi.mocked(auth).mockResolvedValueOnce({
      user: mockUser,
      expires: "9999-12-31",
    });

    const initialProduct = {
      id: "prod-999",
      name: "Słuchawki bezprzewodowe",
      productUrl: "https://example.com/sluchawki",
      imageUrl: "https://example.com/img.png",
      code: "SKU-1234",
      creatorId: mockUser.id,
      rate_avg: 0,
      rate_count: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdReview = {
      id: "rev-999",
      productId: initialProduct.id,
      userId: mockUser.id,
      rate: 4.5,
      description: "Bardzo dobry produkt, polecam!",
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedProduct = {
      ...initialProduct,
      rate_avg: 4.5,
      rate_count: 1,
    };

    mockTx.product.create.mockResolvedValueOnce(initialProduct);
    mockTx.review.create.mockResolvedValueOnce(createdReview);
    mockTx.review.aggregate.mockResolvedValueOnce({
      _avg: { rate: 4.5 },
      _count: { rate: 1 },
    });
    mockTx.product.update.mockResolvedValueOnce(updatedProduct);

    const inputData = {
      name: "Słuchawki bezprzewodowe",
      productUrl: "https://example.com/sluchawki",
      imageUrl: "https://example.com/img.png",
      code: "SKU-1234",
      rate: 4.5,
      description: "Bardzo dobry produkt, polecam!",
    };

    const result = await productWithReviewCreate(inputData);

    expect(result?.serverError).toBeUndefined();
    expect(result?.validationErrors).toBeUndefined();
    expect(result?.data).toEqual({
      product: updatedProduct,
      review: createdReview,
    });

    expect(mockTx.product.create).toHaveBeenCalledWith({
      data: {
        name: inputData.name,
        productUrl: inputData.productUrl,
        imageUrl: inputData.imageUrl,
        code: inputData.code,
        shopId: null,
        creatorId: mockUser.id,
        rate_avg: 0,
        rate_count: 0,
      },
    });

    expect(mockTx.review.create).toHaveBeenCalledWith({
      data: {
        productId: initialProduct.id,
        rate: inputData.rate,
        description: inputData.description,
        userId: mockUser.id,
      },
    });

    expect(mockTx.review.aggregate).toHaveBeenCalledWith({
      where: { productId: initialProduct.id },
      _avg: { rate: true },
      _count: { rate: true },
    });

    expect(mockTx.product.update).toHaveBeenCalledWith({
      where: { id: initialProduct.id },
      data: {
        rate_avg: 4.5,
        rate_count: 1,
      },
    });
  });

  it("handles optional fields by converting empty values to null", async () => {
    const mockUser = {
      id: "user-456",
      name: "Anna",
      email: "anna@example.com",
    };
    vi.mocked(auth).mockResolvedValueOnce({
      user: mockUser,
      expires: "9999-12-31",
    });

    const initialProduct = {
      id: "prod-100",
      name: "Minimalny produkt",
      productUrl: null,
      imageUrl: null,
      code: null,
      creatorId: mockUser.id,
      rate_avg: 0,
      rate_count: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdReview = {
      id: "rev-100",
      productId: initialProduct.id,
      userId: mockUser.id,
      rate: 5,
      description: "Świetna jakość",
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedProduct = {
      ...initialProduct,
      rate_avg: 5,
      rate_count: 1,
    };

    mockTx.product.create.mockResolvedValueOnce(initialProduct);
    mockTx.review.create.mockResolvedValueOnce(createdReview);
    mockTx.review.aggregate.mockResolvedValueOnce({
      _avg: { rate: 5 },
      _count: { rate: 1 },
    });
    mockTx.product.update.mockResolvedValueOnce(updatedProduct);

    const result = await productWithReviewCreate({
      name: "Minimalny produkt",
      productUrl: "",
      imageUrl: "",
      code: "",
      rate: 5,
      description: "Świetna jakość",
    });

    expect(result?.data).toBeDefined();
    expect(mockTx.product.create).toHaveBeenCalledWith({
      data: {
        name: "Minimalny produkt",
        productUrl: null,
        imageUrl: null,
        code: null,
        shopId: null,
        creatorId: mockUser.id,
        rate_avg: 0,
        rate_count: 0,
      },
    });
    expect(mockTx.product.update).toHaveBeenCalledWith({
      where: { id: initialProduct.id },
      data: {
        rate_avg: 5,
        rate_count: 1,
      },
    });
  });
});
