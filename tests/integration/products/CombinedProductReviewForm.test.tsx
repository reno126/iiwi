import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CombinedProductReviewForm } from "@/app/opinie/dodaj/_components/CombinedProductReviewForm";
import { COMBINED_FORM_MESSAGES } from "@/app/opinie/dodaj/_components/combinedFormMessages";
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

function createUrlPromptDriver(user = userEvent.setup()) {
  return {
    heading: () =>
      screen.getByRole("heading", {
        name: COMBINED_FORM_MESSAGES.urlPromptTitle,
      }),
    subtitle: () => screen.getByText(URL_PROMPT_MESSAGES.subtitle),
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
    noLinkQuestion: () => screen.getByText(URL_PROMPT_MESSAGES.noLinkQuestion),
    manualHint: () => screen.getByText(URL_PROMPT_MESSAGES.manualHint),
    async enterUrl(url: string) {
      await user.type(this.urlInput(), url);
    },
    async clickScrape() {
      await user.click(this.scrapeButton());
    },
    async clickManual() {
      await user.click(this.manualModeButton());
    },
  };
}

function createActiveFormDriver(user = userEvent.setup()) {
  return {
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
    backButton: () =>
      screen.getByRole("button", {
        name: COMBINED_FORM_MESSAGES.backLabel,
      }),
    async fillReview(rating: number, description: string) {
      await user.click(this.ratingRadio(rating));
      await user.type(this.reviewTextarea(), description);
    },
    async submit() {
      await user.click(this.submitButton());
    },
    async goBack() {
      await user.click(this.backButton());
    },
  };
}

describe("CombinedProductReviewForm", () => {
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

  describe("Phase Navigation", () => {
    it("initially renders only the 3 main elements and the manual addition option", () => {
      render(
        <CombinedProductReviewForm
          onCancel={onCancelMock}
          onSuccess={onSuccessMock}
        />,
      );
      const promptDriver = createUrlPromptDriver();

      expect(promptDriver.heading()).toBeInTheDocument();
      expect(promptDriver.subtitle()).toBeInTheDocument();
      expect(promptDriver.urlInput()).toBeInTheDocument();
      expect(promptDriver.scrapeButton()).toBeInTheDocument();
      expect(promptDriver.scrapeButton()).toBeDisabled();
      expect(promptDriver.noLinkQuestion()).toBeInTheDocument();
      expect(promptDriver.manualModeButton()).toBeInTheDocument();
      expect(promptDriver.manualHint()).toBeInTheDocument();

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

    it("navigates immediately to manual form without URL field when clicking manual addition", async () => {
      const user = userEvent.setup();
      render(
        <CombinedProductReviewForm
          onCancel={onCancelMock}
          onSuccess={onSuccessMock}
        />,
      );
      const promptDriver = createUrlPromptDriver(user);
      const formDriver = createActiveFormDriver(user);

      await promptDriver.clickManual();

      expect(formDriver.nameInput()).toBeInTheDocument();
      expect(
        screen.getByText(COMBINED_FORM_MESSAGES.manualTitle),
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(PRODUCT_FIELDS_MESSAGES.productUrlLabel),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(REVIEW_FIELDS_MESSAGES.legend),
      ).toBeInTheDocument();
      expect(formDriver.reviewTextarea()).toBeInTheDocument();
    });

    it("allows switching back to URL prompt from active form", async () => {
      const user = userEvent.setup();
      render(
        <CombinedProductReviewForm
          onCancel={onCancelMock}
          onSuccess={onSuccessMock}
        />,
      );
      const promptDriver = createUrlPromptDriver(user);
      const formDriver = createActiveFormDriver(user);

      await promptDriver.clickManual();
      expect(formDriver.nameInput()).toBeInTheDocument();

      await formDriver.goBack();
      expect(promptDriver.heading()).toBeInTheDocument();
    });
  });

  describe("Scraper Integration", () => {
    it("handles scraping flow: fills data and displays success banner", async () => {
      vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
        data: {
          imageUrl: "https://example.com/item.jpg",
          name: "Słuchawki Sony XM5",
          code: "SKU-999",
          shop: null,
          scrapedFields: ["name", "imageUrl", "code", "shop"],
        },
      });

      const user = userEvent.setup();
      render(
        <CombinedProductReviewForm
          onCancel={onCancelMock}
          onSuccess={onSuccessMock}
        />,
      );
      const promptDriver = createUrlPromptDriver(user);
      const formDriver = createActiveFormDriver(user);

      await promptDriver.enterUrl("https://sklep.pl/item-123");
      expect(promptDriver.scrapeButton()).toBeEnabled();
      await promptDriver.clickScrape();

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

      const nameInput = formDriver.nameInput() as HTMLInputElement;
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
    });

    it("handles scraping failure: retains productUrl and displays failure banner", async () => {
      vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
        serverError: "Nie udało się pobrać danych ze wskazanego sklepu.",
      });

      const user = userEvent.setup();
      render(
        <CombinedProductReviewForm
          onCancel={onCancelMock}
          onSuccess={onSuccessMock}
        />,
      );
      const promptDriver = createUrlPromptDriver(user);
      const formDriver = createActiveFormDriver(user);

      await promptDriver.enterUrl("https://unknown-shop.com/item");
      await promptDriver.clickScrape();

      await waitFor(() => {
        expect(
          screen.getByText(SCRAPE_BANNER_MESSAGES.failed.title),
        ).toBeInTheDocument();
      });

      const productUrlInput = formDriver.productUrlInput() as HTMLInputElement;
      expect(productUrlInput.value).toBe("https://unknown-shop.com/item");

      const nameInput = formDriver.nameInput() as HTMLInputElement;
      expect(nameInput.value).toBe("");
    });
  });

  describe("Form Submission", () => {
    it("submits complete product and review payload and triggers onSuccess callback", async () => {
      vi.mocked(productWithReviewCreate).mockResolvedValueOnce({
        data: {
          product: { id: "new-prod-id" } as unknown as Product,
          review: { id: "new-rev-id" } as unknown as Review,
        },
      });

      const user = userEvent.setup();
      render(
        <CombinedProductReviewForm
          onCancel={onCancelMock}
          onSuccess={onSuccessMock}
        />,
      );
      const promptDriver = createUrlPromptDriver(user);
      const formDriver = createActiveFormDriver(user);

      await promptDriver.clickManual();

      await user.type(formDriver.nameInput(), "Słuchawki Sony XM5");
      await formDriver.fillReview(5, "Fantastyczne słuchawki, polecam!");
      await formDriver.submit();

      await waitFor(() => {
        expect(productWithReviewCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Słuchawki Sony XM5",
            rate: 5,
            description: "Fantastyczne słuchawki, polecam!",
          }),
        );
        expect(onSuccessMock).toHaveBeenCalledWith("new-prod-id");
      });
    });
  });

  describe("Auth-Gated Draft Lifecycle", () => {
    it("when unauthenticated, tries session refresh and redirects to login saving draft in localStorage", async () => {
      const updateMock = vi.fn().mockResolvedValue(null);

      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: updateMock,
      });

      const user = userEvent.setup();
      render(
        <CombinedProductReviewForm
          onCancel={onCancelMock}
          onSuccess={onSuccessMock}
        />,
      );
      const promptDriver = createUrlPromptDriver(user);
      const formDriver = createActiveFormDriver(user);

      await promptDriver.clickManual();

      await user.type(formDriver.nameInput(), "Część zapasowa XYZ");
      await formDriver.fillReview(4, "Dobra jakość, polecam!");
      await formDriver.submit();

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

      const user = userEvent.setup();
      render(
        <CombinedProductReviewForm
          onCancel={onCancelMock}
          onSuccess={onSuccessMock}
        />,
      );
      const formDriver = createActiveFormDriver(user);

      expect(
        screen.getByText(COMBINED_FORM_MESSAGES.draftRestored),
      ).toBeInTheDocument();

      const nameInput = formDriver.nameInput() as HTMLInputElement;
      expect(nameInput.value).toBe("Przywrócony produkt");

      const descTextarea = formDriver.reviewTextarea() as HTMLTextAreaElement;
      expect(descTextarea.value).toBe("Opinia przywrócona ze szkicu.");

      await formDriver.submit();

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
});
