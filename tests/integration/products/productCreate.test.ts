import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth helper before importing server action
vi.mock("@/lib/auth/helper", () => ({
  auth: vi.fn(),
}));

// Mock prisma db
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    product: {
      create: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth/helper";
import { prisma } from "@/lib/db/prisma";
import { productCreate } from "@/serverActions/productCreate";

describe("serverActions/productCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns server error when called without an active authenticated session", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const result = await productCreate({
      name: "Nowy produkt testowy",
    });

    expect(result?.serverError).toBeDefined();
    expect(result?.data).toBeUndefined();
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("returns validation errors when input data fails productCreateSchema", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-123", name: "Jan", email: "jan@example.com" },
      expires: "9999-12-31",
    });

    const result = await productCreate({
      name: "AB", // Less than 3 characters
    });

    expect(result?.validationErrors).toBeDefined();
    expect(result?.data).toBeUndefined();
    expect(result?.validationErrors?.fieldErrors?.name).toBeDefined();
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("creates product in database when user is authenticated and input is valid", async () => {
    const mockUser = { id: "user-abc-123", name: "Jan", email: "jan@example.com" };
    vi.mocked(auth).mockResolvedValueOnce({
      user: mockUser,
      expires: "9999-12-31",
    });

    const createdProduct = {
      id: "prod-999",
      name: "Słuchawki bezprzewodowe",
      productUrl: "https://example.com/sluchawki",
      imageUrl: "https://example.com/img.png",
      code: "SKU-1234",
      creatorId: mockUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.product.create).mockResolvedValueOnce(createdProduct);

    const inputData = {
      name: "Słuchawki bezprzewodowe",
      productUrl: "https://example.com/sluchawki",
      imageUrl: "https://example.com/img.png",
      code: "SKU-1234",
    };

    const result = await productCreate(inputData);

    expect(result?.serverError).toBeUndefined();
    expect(result?.validationErrors).toBeUndefined();
    expect(result?.data).toEqual(createdProduct);

    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        name: inputData.name,
        productUrl: inputData.productUrl,
        imageUrl: inputData.imageUrl,
        code: inputData.code,
        creatorId: mockUser.id,
      },
    });
  });

  it("handles optional fields by converting empty values to null", async () => {
    const mockUser = { id: "user-456", name: "Anna", email: "anna@example.com" };
    vi.mocked(auth).mockResolvedValueOnce({
      user: mockUser,
      expires: "9999-12-31",
    });

    vi.mocked(prisma.product.create).mockResolvedValueOnce({
      id: "prod-100",
      name: "Minimalny produkt",
      productUrl: null,
      imageUrl: null,
      code: null,
      creatorId: mockUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await productCreate({
      name: "Minimalny produkt",
      productUrl: "",
      imageUrl: "",
      code: "",
    });

    expect(result?.data).toBeDefined();
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        name: "Minimalny produkt",
        productUrl: null,
        imageUrl: null,
        code: null,
        creatorId: mockUser.id,
      },
    });
  });
});
