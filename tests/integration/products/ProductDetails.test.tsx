import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ProductDetails,
  PRODUCT_DETAILS_MESSAGES,
} from "@/app/produkty/[id]/_components/ProductDetails";
import type { ProductWithReviews } from "@/serverActions/productGetById";
import { reviewCreate } from "@/serverActions/reviewCreate";
import { REVIEW_ERRORS } from "@/schemas/review";
import { REVIEW_FORM_MESSAGES } from "@/components/reviews/ReviewForm";
import { REVIEW_FIELDS_MESSAGES } from "@/components/reviews/ReviewFields";
import { RATING_INPUT_MESSAGES } from "@/components/reviews/RatingInput";
import { useRouter } from "next/navigation";
import {
  saveReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "user-test-1" } },
    status: "authenticated",
    update: vi.fn(),
  }),
}));

vi.mock("@/serverActions/reviewCreate", () => ({
  reviewCreate: vi.fn(),
}));

const mockProduct: ProductWithReviews = {
  id: "prod-123",
  name: "Super Słuchawki",
  productUrl: "https://example.com/sluchawki",
  imageUrl: "https://example.com/headphones.png",
  code: "SKU-999",
  creatorId: "user-creator-1",
  shopId: null,
  rate_avg: 4.5,
  rate_count: 2,
  createdAt: new Date("2026-01-01T10:00:00Z"),
  updatedAt: new Date("2026-01-01T10:00:00Z"),
  creator: {
    id: "user-creator-1",
    name: "Marek Twórca",
    email: "marek@example.com",
  },
  reviews: [
    {
      id: "rev-1",
      description: "Rewelacyjny dźwięk i głęboki bas, warte każdej złotówki!",
      rate: 5,
      likes: 0,
      productId: "prod-123",
      userId: "user-rev-1",
      createdAt: new Date("2026-01-02T12:00:00Z"),
      updatedAt: new Date("2026-01-02T12:00:00Z"),
      user: {
        id: "user-rev-1",
        name: "Tomasz Recenzent",
        email: "tomasz@example.com",
        image: null,
      },
    },
    {
      id: "rev-2",
      description: "Dobre słuchawki, ale mogłyby być odrobinę lżejsze.",
      rate: 4,
      likes: 0,
      productId: "prod-123",
      userId: "user-rev-2",
      createdAt: new Date("2026-01-03T14:00:00Z"),
      updatedAt: new Date("2026-01-03T14:00:00Z"),
      user: {
        id: "user-rev-2",
        name: "Kasia Recenzentka",
        email: "kasia@example.com",
        image: null,
      },
    },
  ],
  _count: {
    reviews: 2,
  },
  averageRate: 4.5,
};

const mockProductWithoutReviews: ProductWithReviews = {
  ...mockProduct,
  id: "prod-empty",
  name: "Produkt bez opinii",
  rate_avg: 0,
  rate_count: 0,
  reviews: [],
  _count: {
    reviews: 0,
  },
  averageRate: null,
};

function createProductDetailsDriver() {
  const user = userEvent.setup();
  return {
    user,
    heading: (name: string | ((name: string) => boolean)) =>
      screen.getByRole("heading", { name }),
    queryHeading: (name: string | ((name: string) => boolean)) =>
      screen.queryByRole("heading", { name }),
    addReviewButtons: () =>
      screen.getAllByRole("button", {
        name: PRODUCT_DETAILS_MESSAGES.addReviewButton,
      }),
    cancelButton: () =>
      screen.getByRole("button", { name: REVIEW_FORM_MESSAGES.cancelButton }),
    publishButton: () =>
      screen.getByRole("button", { name: REVIEW_FORM_MESSAGES.submitButton }),
    ratingRadio: (rating: number) =>
      screen.getByRole("radio", {
        name: RATING_INPUT_MESSAGES.starAriaLabel(rating),
      }),
    descriptionInput: () =>
      screen.getByLabelText(REVIEW_FIELDS_MESSAGES.descriptionLabel),
    firstReviewButton: () =>
      screen.getByRole("button", {
        name: PRODUCT_DETAILS_MESSAGES.firstReviewButton,
      }),
  };
}

describe("app/produkty/[id]/_components/ProductDetails", () => {
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      refresh: mockRefresh,
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("initially displays product details, review count, and the existing reviews list", () => {
    render(<ProductDetails product={mockProduct} />);
    const driver = createProductDetailsDriver();

    expect(driver.heading(mockProduct.name)).toBeInTheDocument();
    expect(screen.getAllByText("SKU-999")[0]).toBeInTheDocument();

    expect(
      driver.heading((name) =>
        name.startsWith(PRODUCT_DETAILS_MESSAGES.reviewsHeading),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Rewelacyjny dźwięk i głęboki bas, warte każdej złotówki!",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Dobre słuchawki, ale mogłyby być odrobinę lżejsze."),
    ).toBeInTheDocument();

    expect(
      driver.queryHeading(PRODUCT_DETAILS_MESSAGES.formHeading),
    ).not.toBeInTheDocument();

    const addReviewBtns = driver.addReviewButtons();
    expect(addReviewBtns).toHaveLength(2);
    expect(addReviewBtns[0]).toBeEnabled();
    expect(addReviewBtns[1]).toBeEnabled();
  });

  it("opens review form and hides existing review list when 'Napisz opinię dla tego produktu' is clicked", async () => {
    render(<ProductDetails product={mockProduct} />);
    const driver = createProductDetailsDriver();

    const [topAddReviewBtn] = driver.addReviewButtons();
    await driver.user.click(topAddReviewBtn);

    expect(
      driver.heading(PRODUCT_DETAILS_MESSAGES.formHeading),
    ).toBeInTheDocument();
    expect(driver.publishButton()).toBeInTheDocument();
    expect(driver.cancelButton()).toBeInTheDocument();

    expect(
      driver.queryHeading((name) =>
        name.startsWith(PRODUCT_DETAILS_MESSAGES.reviewsHeading),
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Rewelacyjny dźwięk i głęboki bas, warte każdej złotówki!",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Dobre słuchawki, ale mogłyby być odrobinę lżejsze."),
    ).not.toBeInTheDocument();

    expect(topAddReviewBtn).toBeDisabled();
    expect(driver.descriptionInput()).toHaveFocus();
  });

  it("returns product page to initial state with reviews list visible when 'Anuluj' is clicked", async () => {
    render(<ProductDetails product={mockProduct} />);
    const driver = createProductDetailsDriver();

    const [topAddReviewBtn] = driver.addReviewButtons();
    await driver.user.click(topAddReviewBtn);
    expect(
      driver.heading(PRODUCT_DETAILS_MESSAGES.formHeading),
    ).toBeInTheDocument();

    await driver.user.click(driver.cancelButton());

    expect(
      driver.queryHeading(PRODUCT_DETAILS_MESSAGES.formHeading),
    ).not.toBeInTheDocument();
    expect(
      driver.heading((name) =>
        name.startsWith(PRODUCT_DETAILS_MESSAGES.reviewsHeading),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Rewelacyjny dźwięk i głęboki bas, warte każdej złotówki!",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Dobre słuchawki, ale mogłyby być odrobinę lżejsze."),
    ).toBeInTheDocument();

    expect(topAddReviewBtn).toBeEnabled();
  });

  it("submits new review, closes review form, and calls router.refresh() to revalidate page data", async () => {
    vi.mocked(reviewCreate).mockResolvedValueOnce({
      data: {
        id: "rev-new",
        productId: mockProduct.id,
        rate: 5,
        description: "Absolutnie fantastyczny sprzęt, polecam gorąco!",
        userId: "user-123",
        likes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    render(<ProductDetails product={mockProduct} />);
    const driver = createProductDetailsDriver();

    const [topAddReviewBtn] = driver.addReviewButtons();
    await driver.user.click(topAddReviewBtn);

    await driver.user.click(driver.ratingRadio(5));
    await driver.user.type(
      driver.descriptionInput(),
      "Absolutnie fantastyczny sprzęt, polecam gorąco!",
    );

    await driver.user.click(driver.publishButton());

    await waitFor(() => {
      expect(reviewCreate).toHaveBeenCalledWith({
        productId: mockProduct.id,
        rate: 5,
        description: "Absolutnie fantastyczny sprzęt, polecam gorąco!",
      });
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(
        driver.queryHeading(PRODUCT_DETAILS_MESSAGES.formHeading),
      ).not.toBeInTheDocument();
      expect(
        driver.heading((name) =>
          name.startsWith(PRODUCT_DETAILS_MESSAGES.reviewsHeading),
        ),
      ).toBeInTheDocument();
    });
  });

  it("opens review form when button after the reviews list is clicked", async () => {
    render(<ProductDetails product={mockProduct} />);
    const driver = createProductDetailsDriver();

    const addReviewBtns = driver.addReviewButtons();
    expect(addReviewBtns).toHaveLength(2);
    await driver.user.click(addReviewBtns[1]);

    expect(
      driver.heading(PRODUCT_DETAILS_MESSAGES.formHeading),
    ).toBeInTheDocument();
    expect(
      driver.queryHeading((name) =>
        name.startsWith(PRODUCT_DETAILS_MESSAGES.reviewsHeading),
      ),
    ).not.toBeInTheDocument();
  });

  it("opens review form on product without reviews when empty state button is clicked", async () => {
    render(<ProductDetails product={mockProductWithoutReviews} />);
    const driver = createProductDetailsDriver();

    expect(
      screen.getByText(PRODUCT_DETAILS_MESSAGES.emptyTitle),
    ).toBeInTheDocument();

    await driver.user.click(driver.firstReviewButton());

    expect(
      driver.heading(PRODUCT_DETAILS_MESSAGES.formHeading),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(PRODUCT_DETAILS_MESSAGES.emptyTitle),
    ).not.toBeInTheDocument();

    await driver.user.click(driver.cancelButton());
    expect(
      screen.getByText(PRODUCT_DETAILS_MESSAGES.emptyTitle),
    ).toBeInTheDocument();
  });

  it("reserves space for validation messages and reveals them on empty submit", async () => {
    render(<ProductDetails product={mockProduct} />);
    const driver = createProductDetailsDriver();

    const [topAddReviewBtn] = driver.addReviewButtons();
    await driver.user.click(topAddReviewBtn);

    expect(driver.descriptionInput()).not.toBeInvalid();

    await driver.user.click(driver.publishButton());

    await waitFor(() => {
      expect(driver.descriptionInput()).toBeInvalid();
      expect(screen.getByText(REVIEW_ERRORS.rateRequired)).toBeInTheDocument();
      expect(
        screen.getByText(REVIEW_ERRORS.descriptionMinLength),
      ).toBeInTheDocument();
    });
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it("automatically opens review form and restores draft when review draft exists for this product in localStorage", () => {
    saveReviewDraft({
      type: "REVIEW_EXISTING_PRODUCT",
      productId: mockProduct.id,
      formData: {
        productId: mockProduct.id,
        rate: 4,
        description: "Zapamiętana wersja robocza opinii",
      },
    });

    render(<ProductDetails product={mockProduct} />);
    const driver = createProductDetailsDriver();

    expect(
      driver.heading(PRODUCT_DETAILS_MESSAGES.formHeading),
    ).toBeInTheDocument();
    expect(
      screen.getByText(REVIEW_FORM_MESSAGES.draftRestored),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Zapamiętana wersja robocza opinii"),
    ).toBeInTheDocument();

    clearReviewDraft();
  });
});
