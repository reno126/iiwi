import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CombinedProductReviewForm } from "@/app/opinie/dodaj/_components/CombinedProductReviewForm";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import { productWithReviewCreate } from "@/serverActions/productWithReviewCreate";
import {
  saveReviewDraft,
  getReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";
import type { Product, Review } from "@/prisma/generated/client";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/serverActions/productScrapeMetadata", () => ({
  productScrapeMetadata: vi.fn(),
}));

vi.mock("@/serverActions/productWithReviewCreate", () => ({
  productWithReviewCreate: vi.fn(),
}));

vi.mock("@/serverActions/shopMatchByUrlAction", () => ({
  shopMatchByUrlAction: vi.fn().mockResolvedValue(null),
}));

function createCombinedReviewDriver() {
  const user = userEvent.setup();
  return {
    user,
    urlPromptHeading: () =>
      screen.getByRole("heading", { name: /masz link do oferty produktu/i }),
    urlInput: () => screen.getByRole("textbox", { name: /link do oferty produktu/i }),
    scrapeButton: () => screen.getByRole("button", { name: /pobierz info/i }),
    manualModeButton: () =>
      screen.getByRole("button", { name: /dodaj produkt ręcznie/i }),
    changeModeButton: () =>
      screen.getByRole("button", { name: /zmień sposób wprowadzania/i }),
    nameInput: () => screen.getByLabelText(/nazwa produktu/i),
    productUrlInput: () => screen.getByLabelText(/adres url do produktu/i),
    codeInput: () => screen.getByLabelText(/kod produktu \/ ean/i),
    ratingRadio: (rating: number) =>
      screen.getByRole("radio", {
        name: new RegExp(`${rating} z 5 gwiazdek`, "i"),
      }),
    reviewTextarea: () => screen.getByLabelText(/treść recenzji/i),
    submitButton: () =>
      screen.getByRole("button", { name: /dodaj produkt i opinię/i }),
    alert: () => screen.getByRole("alert"),
    statusBadges: (label: RegExp | string) => screen.getAllByText(label),
  };
}

describe("CombinedProductReviewForm - New Flow", () => {
  const onCancelMock = vi.fn();
  const onSuccessMock = vi.fn();
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    clearReviewDraft();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "test-user-1" }, expires: "9999-12-31" },
      status: "authenticated",
      update: vi.fn(),
    });
  });

  it("initially renders only the 3 main elements and the manual addition option", () => {
    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />,
    );
    const driver = createCombinedReviewDriver();

    expect(driver.urlPromptHeading()).toBeInTheDocument();
    expect(
      screen.getByText(/wklej go poniżej, to pójdzie szybko!/i),
    ).toBeInTheDocument();

    expect(driver.urlInput()).toBeInTheDocument();

    expect(driver.scrapeButton()).toBeInTheDocument();
    expect(driver.scrapeButton()).toBeDisabled();

    expect(
      screen.getByText(/nie masz linku do oferty\?/i),
    ).toBeInTheDocument();
    expect(driver.manualModeButton()).toBeInTheDocument();
    expect(
      screen.getByText(/wymagamy tylko nazwy, no i opinii/i),
    ).toBeInTheDocument();

    expect(screen.queryByLabelText(/nazwa produktu/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ocena/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/treść recenzji/i)).not.toBeInTheDocument();
  });

  it("navigates immediately to manual form without URL field when clicking 'Dodaj produkt ręcznie'", async () => {
    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />,
    );
    const driver = createCombinedReviewDriver();

    await driver.user.click(driver.manualModeButton());

    expect(driver.nameInput()).toBeInTheDocument();
    expect(screen.getByText(/tryb ręczny/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/adres url do produktu/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/twoja opinia/i)).toBeInTheDocument();
    expect(driver.reviewTextarea()).toBeInTheDocument();
  });

  it("handles scraping flow: fills data, displays success banner with scraped fields, and submits", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/item.jpg",
        name: "Słuchawki Sony XM5",
        code: "SKU-999",
        shop: null,
        scrapedFields: ["name", "imageUrl", "code", "shop"],
      },
    });

    vi.mocked(productWithReviewCreate).mockResolvedValueOnce({
      data: {
        product: { id: "new-prod-id" } as unknown as Product,
        review: { id: "new-rev-id" } as unknown as Review,
      },
    });

    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />,
    );
    const driver = createCombinedReviewDriver();

    await driver.user.type(driver.urlInput(), "https://sklep.pl/item-123");

    expect(driver.scrapeButton()).toBeEnabled();
    await driver.user.click(driver.scrapeButton());

    await waitFor(() => {
      expect(productScrapeMetadata).toHaveBeenCalledWith({
        productUrl: "https://sklep.pl/item-123",
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/pobrano wszystkie potrzebne dane produktu/i),
      ).toBeInTheDocument();
    });

    const nameInput = driver.nameInput() as HTMLInputElement;
    expect(nameInput.value).toBe("Słuchawki Sony XM5");

    expect(
      screen.queryByLabelText(/adres url do produktu/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /wyciągnij zdjęcie produktu/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText(/adres url zdjęcia/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/podgląd zdjęcia produktu/i),
    ).toBeInTheDocument();

    await driver.user.click(driver.ratingRadio(5));
    await driver.user.type(
      driver.reviewTextarea(),
      "Fantastyczne słuchawki, polecam!",
    );

    await driver.user.click(driver.submitButton());

    await waitFor(() => {
      expect(productWithReviewCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Słuchawki Sony XM5",
          productUrl: "https://sklep.pl/item-123",
          imageUrl: "https://example.com/item.jpg",
          code: "SKU-999",
        }),
      );
      expect(onSuccessMock).toHaveBeenCalledWith("new-prod-id");
    });
  });

  it("handles scraping failure: retains productUrl and displays failure banner", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      serverError: "Nie udało się pobrać danych ze wskazanego sklepu.",
    });

    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />,
    );
    const driver = createCombinedReviewDriver();

    await driver.user.type(driver.urlInput(), "https://unknown-shop.com/item");
    await driver.user.click(driver.scrapeButton());

    await waitFor(() => {
      expect(
        screen.getByText(/nie udało się pobrać danych/i),
      ).toBeInTheDocument();
    });

    const productUrlInput = driver.productUrlInput() as HTMLInputElement;
    expect(productUrlInput.value).toBe("https://unknown-shop.com/item");

    const nameInput = driver.nameInput() as HTMLInputElement;
    expect(nameInput.value).toBe("");
  });

  it("allows switching back to URL prompt from active form", async () => {
    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />,
    );
    const driver = createCombinedReviewDriver();

    await driver.user.click(driver.manualModeButton());

    expect(driver.nameInput()).toBeInTheDocument();

    await driver.user.click(driver.changeModeButton());

    expect(driver.urlPromptHeading()).toBeInTheDocument();
  });

  it("marks scraped vs missing fields and reactively updates status when user completes missing data", async () => {
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/keyboard.jpg",
        name: "Klawiatura Mechaniczna Pro",
        code: "",
        shop: null,
        scrapedFields: ["name", "imageUrl"],
      },
    });

    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />,
    );
    const driver = createCombinedReviewDriver();

    await driver.user.type(driver.urlInput(), "https://sklep.pl/keyboard");
    await driver.user.click(driver.scrapeButton());

    await waitFor(() => {
      const nameInput = driver.nameInput() as HTMLInputElement;
      expect(nameInput.value).toBe("Klawiatura Mechaniczna Pro");
    });

    expect(driver.statusBadges(/uzupełnione/i).length).toBe(2);
    expect(driver.statusBadges(/do uzupełnienia/i).length).toBe(2);

    await driver.user.type(driver.codeInput(), "5901234567890");

    await waitFor(() => {
      expect(driver.statusBadges(/uzupełnione/i).length).toBe(3);
      expect(driver.statusBadges(/do uzupełnienia/i).length).toBe(1);
    });
  });

  it("when unauthenticated, tries session refresh and redirects to login saving draft in localStorage", async () => {
    const updateMock = vi.fn().mockResolvedValue(null);

    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: updateMock,
    });

    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />,
    );
    const driver = createCombinedReviewDriver();

    await driver.user.click(driver.manualModeButton());

    await driver.user.type(driver.nameInput(), "Część zapasowa XYZ");
    await driver.user.click(driver.ratingRadio(4));
    await driver.user.type(
      driver.reviewTextarea(),
      "Dobra jakość, polecam!",
    );

    await driver.user.click(driver.submitButton());

    expect(updateMock).toHaveBeenCalled();
    expect(productWithReviewCreate).not.toHaveBeenCalled();

    const savedDraft = getReviewDraft();
    expect(savedDraft).toBeDefined();
    expect(savedDraft?.type).toBe("NEW_PRODUCT_AND_REVIEW");
    if (savedDraft?.type === "NEW_PRODUCT_AND_REVIEW") {
      expect(savedDraft.formData.name).toBe("Część zapasowa XYZ");
      expect(savedDraft.formData.rate).toBe(4);
      expect(savedDraft.formData.description).toBe("Dobra jakość, polecam!");
      expect(savedDraft.phase?.mode).toBe("manual");
    }

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("/login?callbackUrl="),
    );
  });

  it("restores form data and active phase from existing localStorage draft on mount, and displays banner", async () => {
    saveReviewDraft({
      type: "NEW_PRODUCT_AND_REVIEW",
      formData: {
        name: "Przywrócony produkt",
        productUrl: "https://sklep.pl/item-restored",
        imageUrl: "https://sklep.pl/image-restored.jpg",
        code: "RESTORED-123",
        shopId: "",
        rate: 5,
        description: "Opinia przywrócona ze szkicu.",
      },
      phase: {
        mode: "scraped_success",
        scrapedFields: ["name", "imageUrl", "code"],
      },
      detectedShop: null,
    });

    vi.mocked(productWithReviewCreate).mockResolvedValueOnce({
      data: {
        product: { id: "restored-prod-id" } as unknown as Product,
        review: { id: "restored-rev-id" } as unknown as Review,
      },
    });

    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />,
    );
    const driver = createCombinedReviewDriver();

    expect(
      screen.getByText(/twoje dane zostały przywrócone po zalogowaniu/i),
    ).toBeInTheDocument();

    const nameInput = driver.nameInput() as HTMLInputElement;
    expect(nameInput.value).toBe("Przywrócony produkt");

    const descTextarea = driver.reviewTextarea() as HTMLTextAreaElement;
    expect(descTextarea.value).toBe("Opinia przywrócona ze szkicu.");

    await driver.user.click(driver.submitButton());

    await waitFor(() => {
      expect(productWithReviewCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Przywrócony produkt",
          rate: 5,
          description: "Opinia przywrócona ze szkicu.",
        }),
      );
      expect(onSuccessMock).toHaveBeenCalledWith("restored-prod-id");
    });

    expect(getReviewDraft()).toBeNull();
  });
});

