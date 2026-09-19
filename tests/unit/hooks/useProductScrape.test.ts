import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProductScrape } from "@/hooks/useProductScrape";
import { PRODUCT_ERRORS } from "@/schemas/product";

vi.mock("@/serverActions/productScrapeMetadata", () => ({
  productScrapeMetadata: vi.fn(),
}));

import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";

const TEST_ERROR_MESSAGES = {
  serverError: "Strona sklepu jest niedostępna.",
  globalValidationError: "Błąd walidacji globalnej",
  unexpectedError: "Wystąpił nieoczekiwany błąd podczas pobierania danych.",
  successNotice: "Dane pobrane!",
} as const;

describe("hooks/useProductScrape", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing when input URL is empty or only whitespace", async () => {
    const { result } = renderHook(() => useProductScrape());
    const onSuccessMock = vi.fn();
    const onErrorMock = vi.fn();

    await act(async () => {
      await result.current.scrapeUrl("", onSuccessMock, onErrorMock);
      await result.current.scrapeUrl("   ", onSuccessMock, onErrorMock);
    });

    expect(productScrapeMetadata).not.toHaveBeenCalled();
    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onErrorMock).not.toHaveBeenCalled();
  });

  it("normalizes URL by prepending https:// when missing protocol", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        name: "Test Name",
        imageUrl: "https://example.com/img.jpg",
        code: "123",
        shop: null,
        scrapedFields: ["name"],
      },
    });

    const { result } = renderHook(() => useProductScrape());

    await act(async () => {
      await result.current.scrapeUrl("sklep.pl/produkt/123");
    });

    expect(productScrapeMetadata).toHaveBeenCalledWith({
      productUrl: "https://sklep.pl/produkt/123",
    });
  });

  it("invokes onSuccess with scraped data on successful response", async () => {
    const mockData = {
      name: "Słuchawki",
      imageUrl: "https://example.com/audio.jpg",
      code: "AUDIO-01",
      shop: {
        id: "shop-1",
        name: "Media",
        logo: "https://example.com/logo.png",
      },
      scrapedFields: ["name", "code"] as (
        | "name"
        | "code"
        | "shop"
        | "imageUrl"
      )[],
    };

    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: mockData,
    });

    const { result } = renderHook(() => useProductScrape());
    const onSuccessMock = vi.fn();
    const onErrorMock = vi.fn();

    await act(async () => {
      await result.current.scrapeUrl(
        "https://example.com/item",
        onSuccessMock,
        onErrorMock,
      );
    });

    expect(onSuccessMock).toHaveBeenCalledWith(mockData);
    expect(onErrorMock).not.toHaveBeenCalled();
    expect(result.current.scrapeNotice).toBeNull();
    expect(result.current.isTier2NoticeVisible).toBe(false);
  });

  it("displays tier 2 delay notice when scraping takes longer than 2500ms and cleans up afterwards", async () => {
    vi.useFakeTimers();

    let resolvePromise!: (val: {
      data: {
        name: string;
        imageUrl: null;
        code: null;
        shop: null;
        scrapedFields: string[];
      };
    }) => void;
    const delayedPromise = new Promise<{
      data: {
        name: string;
        imageUrl: null;
        code: null;
        shop: null;
        scrapedFields: string[];
      };
    }>((res) => {
      resolvePromise = res;
    });

    vi.mocked(productScrapeMetadata).mockReturnValueOnce(
      delayedPromise as never,
    );

    const { result } = renderHook(() => useProductScrape());

    act(() => {
      result.current.scrapeUrl("https://slow-shop.com/product");
    });

    expect(result.current.isTier2NoticeVisible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.isTier2NoticeVisible).toBe(true);

    await act(async () => {
      resolvePromise({
        data: {
          name: "Wolny produkt",
          imageUrl: null,
          code: null,
          shop: null,
          scrapedFields: ["name"],
        },
      });
      await delayedPromise;
    });

    expect(result.current.isTier2NoticeVisible).toBe(false);
  });

  it("sets error notice and calls onError when server returns serverError", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      serverError: TEST_ERROR_MESSAGES.serverError,
    });

    const { result } = renderHook(() => useProductScrape());
    const onErrorMock = vi.fn();

    await act(async () => {
      await result.current.scrapeUrl(
        "https://error-shop.com",
        undefined,
        onErrorMock,
      );
    });

    expect(result.current.scrapeNotice).toEqual({
      type: "error",
      message: TEST_ERROR_MESSAGES.serverError,
    });
    expect(onErrorMock).toHaveBeenCalledWith(TEST_ERROR_MESSAGES.serverError);
  });

  it("sets error notice from validation fieldErrors", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      validationErrors: {
        formErrors: [],
        fieldErrors: {
          productUrl: [PRODUCT_ERRORS.productUrlInvalid],
        },
      },
    });

    const { result } = renderHook(() => useProductScrape());
    const onErrorMock = vi.fn();

    await act(async () => {
      await result.current.scrapeUrl(
        "https://invalid-url.com",
        undefined,
        onErrorMock,
      );
    });

    expect(result.current.scrapeNotice).toEqual({
      type: "error",
      message: PRODUCT_ERRORS.productUrlInvalid,
    });
    expect(onErrorMock).toHaveBeenCalledWith(PRODUCT_ERRORS.productUrlInvalid);
  });

  it("sets error notice from validation formErrors", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      validationErrors: {
        formErrors: [TEST_ERROR_MESSAGES.globalValidationError],
        fieldErrors: {},
      },
    });

    const { result } = renderHook(() => useProductScrape());

    await act(async () => {
      await result.current.scrapeUrl("https://shop.com/item");
    });

    expect(result.current.scrapeNotice).toEqual({
      type: "error",
      message: TEST_ERROR_MESSAGES.globalValidationError,
    });
  });

  it("catches thrown exceptions and sets fallback error notice", async () => {
    vi.mocked(productScrapeMetadata).mockRejectedValueOnce(
      new Error("Network failure"),
    );

    const { result } = renderHook(() => useProductScrape());
    const onErrorMock = vi.fn();

    await act(async () => {
      await result.current.scrapeUrl(
        "https://crash-shop.com",
        undefined,
        onErrorMock,
      );
    });

    expect(result.current.scrapeNotice).toEqual({
      type: "error",
      message: TEST_ERROR_MESSAGES.unexpectedError,
    });
    expect(onErrorMock).toHaveBeenCalledWith(
      TEST_ERROR_MESSAGES.unexpectedError,
    );
  });

  it("allows updating and clearing scrapeNotice via setScrapeNotice", () => {
    const { result } = renderHook(() => useProductScrape());

    act(() => {
      result.current.setScrapeNotice({
        type: "success",
        message: TEST_ERROR_MESSAGES.successNotice,
      });
    });
    expect(result.current.scrapeNotice).toEqual({
      type: "success",
      message: TEST_ERROR_MESSAGES.successNotice,
    });

    act(() => {
      result.current.setScrapeNotice(null);
    });
    expect(result.current.scrapeNotice).toBeNull();
  });
});
