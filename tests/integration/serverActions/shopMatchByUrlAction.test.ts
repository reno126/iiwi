import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/helper", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/shops/findShopByUrl", () => ({
  findShopByUrl: vi.fn(),
}));

import { auth } from "@/lib/auth/helper";
import { findShopByUrl } from "@/lib/shops/findShopByUrl";
import { shopMatchByUrlAction } from "@/serverActions/shopMatchByUrlAction";

describe("serverActions/shopMatchByUrlAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-test-1", email: "user@example.com" },
      expires: "9999-12-31",
    });
  });

  it("allows unauthenticated callers to match shops by url", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);
    const mockShop = {
      id: "shop-me",
      name: "Media Expert",
      logo: "https://example.com/me.png",
    };
    vi.mocked(findShopByUrl).mockResolvedValueOnce(mockShop);

    const result = await shopMatchByUrlAction({
      url: "https://mediaexpert.pl",
    });

    expect(result?.data).toEqual(mockShop);
    expect(result?.serverError).toBeUndefined();
  });

  it("calls findShopByUrl and returns matched shop data", async () => {
    const mockShop = {
      id: "shop-me",
      name: "Media Expert",
      logo: "https://example.com/me.png",
    };

    vi.mocked(findShopByUrl).mockResolvedValueOnce(mockShop);

    const result = await shopMatchByUrlAction({
      url: "https://www.mediaexpert.pl/agd/pralki/123",
    });

    expect(result?.data).toEqual(mockShop);
    expect(findShopByUrl).toHaveBeenCalledWith(
      "https://www.mediaexpert.pl/agd/pralki/123"
    );
  });

  it("returns validation error when url is empty", async () => {
    const result = await shopMatchByUrlAction({
      url: "",
    });

    expect(result?.validationErrors).toBeDefined();
    expect(findShopByUrl).not.toHaveBeenCalled();
  });
});
