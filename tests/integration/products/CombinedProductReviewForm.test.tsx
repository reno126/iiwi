import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CombinedProductReviewForm,
  COMBINED_FORM_MESSAGES,
} from "@/app/opinie/dodaj/_components/CombinedProductReviewForm";
import { URL_PROMPT_MESSAGES } from "@/app/opinie/dodaj/_components/UrlPromptStep";
import { SCRAPE_BANNER_MESSAGES } from "@/app/opinie/dodaj/_components/ScrapeNoticeBanner";
import { PRODUCT_FIELDS_MESSAGES } from "@/app/opinie/dodaj/_components/ProductFields";
import { REVIEW_FIELDS_MESSAGES } from "@/components/reviews/ReviewFields";
import { RATING_INPUT_MESSAGES } from "@/components/reviews/RatingInput";
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
      screen.getByRole("heading", {
        name: COMBINED_FORM_MESSAGES.urlPromptTitle,
      }),
    urlInput: () =>
      screen.getByRole("textbox", {
        name: URL_PROMPT_MESSAGES.urlInputAriaLabel,
      }),
    scrapeButton: () =>
      screen.getByRole("button", {
        name: URL_PROMPT_MESSAGES.scrapeButton,
      }),
    manualModeButton: () =>
      screen.getByRole("button", {
        name: URL_PROMPT_MESSAGES.manualButton,
      }),
    changeModeButton: () =>
      screen.getByRole("button", {
        name: COMBINED_FORM_MESSAGES.backLabel,
      }),
    nameInput: () => screen.getByLabelText(PRODUCT_FIELDS_MESSAGES.nameLabel),
    productUrlInput: () =>
      screen.getByLabelText(PRODUCT_FIELDS_MESSAGES.productUrlLabel),
    codeInput: () => screen.getByLabelText(PRODUCT_FIELDS_MESSAGES.codeLabel),
    ratingRadio: (rating: number) =>
      screen.getByRole("radio", {
        name: RATING_INPUT_MESSAGES.starAriaLabel(rating),
      }),
    reviewTextarea: () =>
      screen.getByLabelText(REVIEW_FIELDS_MESSAGES.descriptionLabel),
    submitButton: () =>
      screen.getByRole("button", {
        name: COMBINED_FORM_MESSAGES.submitLabel,
      }),
    alert: () => screen.getByRole("alert"),
    statusBadges: (label: string) => screen.getAllByText(label),
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
    expect(screen.getByText(URL_PROMPT_MESSAGES.subtitle)).toBeInTheDocument();

    expect(driver.urlInput()).toBeInTheDocument();

    expect(driver.scrapeButton()).toBeInTheDocument();
    expect(driver.scrapeButton()).toBeDisabled();

    expect(
      screen.getByText(URL_PROMPT_MESSAGES.noLinkQuestion),
    ).toBeInTheDocument();
    expect(driver.manualModeButton()).toBeInTheDocument();
    expect(
      screen.getByText(URL_PROMPT_MESSAGES.manualHint),
    ).toBeInTheDocument();

    expect(
      screen.queryByLabelText(PRODUCT_FIELDS_MESSAGES.nameLabel),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(REVIEW_FIELDS_MESSAGES.rateLabel),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(REVIEW_FIELDS_MESSAGES.descriptionLabel),
    ).not.toBeInTheDocument();
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
    expect(
      screen.getByText(COMBINED_FORM_MESSAGES.manualTitle),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(PRODUCT_FIELDS_MESSAGES.productUrlLabel),
    ).not.toBeInTheDocument();
    expect(screen.getByText(REVIEW_FIELDS_MESSAGES.legend)).toBeInTheDocument();
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
        screen.getByText(SCRAPE_BANNER_MESSAGES.success.title),
      ).toBeInTheDocument();
    });

    const nameInput = driver.nameInput() as HTMLInputElement;
    expect(nameInput.value).toBe("Słuchawki Sony XM5");

    expect(
      screen.queryByLabelText(PRODUCT_FIELDS_MESSAGES.productUrlLabel),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: PRODUCT_FIELDS_MESSAGES.scrapeButton,
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByLabelText(PRODUCT_FIELDS_MESSAGES.imageUrlLabel),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(PRODUCT_FIELDS_MESSAGES.imagePreviewAlt),
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
        screen.getByText(SCRAPE_BANNER_MESSAGES.failed.title),
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

    expect(
      driver.statusBadges(PRODUCT_FIELDS_MESSAGES.statusFilled).length,
    ).toBe(2);
    expect(
      driver.statusBadges(PRODUCT_FIELDS_MESSAGES.statusMissing).length,
    ).toBe(2);

    await driver.user.type(driver.codeInput(), "5901234567890");

    await waitFor(() => {
      expect(
        driver.statusBadges(PRODUCT_FIELDS_MESSAGES.statusFilled).length,
      ).toBe(3);
      expect(
        driver.statusBadges(PRODUCT_FIELDS_MESSAGES.statusMissing).length,
      ).toBe(1);
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
    await driver.user.type(driver.reviewTextarea(), "Dobra jakość, polecam!");

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
      screen.getByText(COMBINED_FORM_MESSAGES.draftRestored),
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
