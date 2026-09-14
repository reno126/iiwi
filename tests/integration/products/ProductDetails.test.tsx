import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductDetails } from "@/app/produkty/[id]/_components/ProductDetails";
import type { ProductWithReviews } from "@/serverActions/productGetById";
import { reviewCreate } from "@/serverActions/reviewCreate";
import { useRouter } from "next/navigation";
import {
  saveReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "user-test-1" } },
    status: "authenticated",
    update: vi.fn(),
  }),
}));

// Mock reviewCreate server action
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

    // Check product title and details
    expect(screen.getByRole("heading", { name: "Super Słuchawki" })).toBeInTheDocument();
    expect(screen.getAllByText("SKU-999")[0]).toBeInTheDocument();

    // Check review list is visible
    expect(screen.getByRole("heading", { name: /Opinie użytkowników/i })).toBeInTheDocument();
    expect(
      screen.getByText("Rewelacyjny dźwięk i głęboki bas, warte każdej złotówki!"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Dobre słuchawki, ale mogłyby być odrobinę lżejsze."),
    ).toBeInTheDocument();

    // Review form should NOT be visible initially
    expect(screen.queryByRole("heading", { name: "Napisz swoją opinię" })).not.toBeInTheDocument();

    // "Napisz opinię dla tego produktu" buttons are visible and enabled (top card and bottom after review list)
    const addReviewBtns = screen.getAllByRole("button", {
      name: /Napisz opinię dla tego produktu/i,
    });
    expect(addReviewBtns).toHaveLength(2);
    expect(addReviewBtns[0]).toBeInTheDocument();
    expect(addReviewBtns[0]).toBeEnabled();
    expect(addReviewBtns[1]).toBeInTheDocument();
    expect(addReviewBtns[1]).toBeEnabled();
  });

  it("opens review form and hides existing review list when 'Napisz opinię dla tego produktu' is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductDetails product={mockProduct} />);

    const [topAddReviewBtn] = screen.getAllByRole("button", {
      name: /Napisz opinię dla tego produktu/i,
    });
    await user.click(topAddReviewBtn);

    // Review form must be open
    expect(screen.getByRole("heading", { name: "Napisz swoją opinię" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Opublikuj opinię/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anuluj" })).toBeInTheDocument();

    // Existing review list must be hidden while the form is open
    expect(screen.queryByRole("heading", { name: /Opinie użytkowników/i })).not.toBeInTheDocument();
    expect(
      screen.queryByText("Rewelacyjny dźwięk i głęboki bas, warte każdej złotówki!"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Dobre słuchawki, ale mogłyby być odrobinę lżejsze."),
    ).not.toBeInTheDocument();

    // The button in the main card is disabled while the review form is open
    expect(topAddReviewBtn).toBeDisabled();

    // Focus must be placed on "Treść recenzji *" textarea
    const descTextarea = screen.getByLabelText(/Treść recenzji/i);
    expect(descTextarea).toHaveFocus();
  });

  it("returns product page to initial state with reviews list visible when 'Anuluj' is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductDetails product={mockProduct} />);

    // Open form using top button
    const [topAddReviewBtn] = screen.getAllByRole("button", {
      name: /Napisz opinię dla tego produktu/i,
    });
    await user.click(topAddReviewBtn);
    expect(screen.getByRole("heading", { name: "Napisz swoją opinię" })).toBeInTheDocument();

    // Click "Anuluj"
    const cancelBtn = screen.getByRole("button", { name: "Anuluj" });
    await user.click(cancelBtn);

    // Review form must be closed
    expect(screen.queryByRole("heading", { name: "Napisz swoją opinię" })).not.toBeInTheDocument();

    // Existing reviews list must be restored
    expect(screen.getByRole("heading", { name: /Opinie użytkowników/i })).toBeInTheDocument();
    expect(
      screen.getByText("Rewelacyjny dźwięk i głęboki bas, warte każdej złotówki!"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Dobre słuchawki, ale mogłyby być odrobinę lżejsze."),
    ).toBeInTheDocument();

    // Main button is enabled again
    expect(topAddReviewBtn).toBeEnabled();
  });

  it("submits new review, closes review form, and calls router.refresh() to revalidate page data", async () => {
    const user = userEvent.setup();
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

    // Open form
    const [topAddReviewBtn] = screen.getAllByRole("button", {
      name: /Napisz opinię dla tego produktu/i,
    });
    await user.click(topAddReviewBtn);

    // Fill rating (rate = 5 stars)
    const star5 = screen.getByRole("radio", { name: /5 z 5 gwiazdek/i });
    await user.click(star5);

    // Fill review description
    const descInput = screen.getByLabelText(/Treść recenzji/i);
    await user.type(descInput, "Absolutnie fantastyczny sprzęt, polecam gorąco!");

    // Submit review
    const submitBtn = screen.getByRole("button", { name: /Opublikuj opinię/i });
    await user.click(submitBtn);

    // Verify reviewCreate was called with correct input
    await waitFor(() => {
      expect(reviewCreate).toHaveBeenCalledWith({
        productId: mockProduct.id,
        rate: 5,
        description: "Absolutnie fantastyczny sprzęt, polecam gorąco!",
      });
    });

    // Form should close and router.refresh() must be called
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("heading", { name: "Napisz swoją opinię" })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Opinie użytkowników/i })).toBeInTheDocument();
    });
  });

  it("opens review form when button after the reviews list is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductDetails product={mockProduct} />);

    // Click the bottom "Napisz opinię dla tego produktu" button after the review list
    const addReviewBtns = screen.getAllByRole("button", {
      name: /Napisz opinię dla tego produktu/i,
    });
    expect(addReviewBtns).toHaveLength(2);
    await user.click(addReviewBtns[1]);

    // Form should open and review list should hide
    expect(screen.getByRole("heading", { name: "Napisz swoją opinię" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Opinie użytkowników/i })).not.toBeInTheDocument();
  });

  it("opens review form on product without reviews when empty state button is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductDetails product={mockProductWithoutReviews} />);

    // Check empty state message
    expect(screen.getByText("Brak opinii dla tego produktu")).toBeInTheDocument();

    // Click "Bądź pierwszą osobą, która doda recenzję"
    const firstReviewBtn = screen.getByRole("button", {
      name: "Bądź pierwszą osobą, która doda recenzję",
    });
    await user.click(firstReviewBtn);

    // Form should open and empty state should hide
    expect(screen.getByRole("heading", { name: "Napisz swoją opinię" })).toBeInTheDocument();
    expect(screen.queryByText("Brak opinii dla tego produktu")).not.toBeInTheDocument();

    // Clicking "Anuluj" restores the empty state
    await user.click(screen.getByRole("button", { name: "Anuluj" }));
    expect(screen.getByText("Brak opinii dla tego produktu")).toBeInTheDocument();
  });

  it("reserves space for validation messages and reveals them on empty submit", async () => {
    const user = userEvent.setup();
    render(<ProductDetails product={mockProduct} />);

    const [topAddReviewBtn] = screen.getAllByRole("button", {
      name: /Napisz opinię dla tego produktu/i,
    });
    await user.click(topAddReviewBtn);

    // Initial state: space is reserved for error messages (elements have min-h-5 and are invisible)
    const errorContainers = document.querySelectorAll("[data-slot='field-error']");
    expect(errorContainers.length).toBe(2);
    expect(errorContainers[0]).toHaveClass("min-h-5", "invisible");
    expect(errorContainers[1]).toHaveClass("min-h-5", "invisible");

    // Submit without filling fields
    const submitBtn = screen.getByRole("button", { name: /Opublikuj opinię/i });
    await user.click(submitBtn);

    // Validation messages should now be visible and invisible class removed
    await waitFor(() => {
      expect(screen.getByText("Ocena jest wymagana")).toBeInTheDocument();
      expect(screen.getByText("Treść recenzji musi mieć co najmniej 3 znaki")).toBeInTheDocument();
      expect(errorContainers[0]).not.toHaveClass("invisible");
      expect(errorContainers[1]).not.toHaveClass("invisible");
    });
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

    // Review form should be open automatically
    expect(screen.getByRole("heading", { name: "Napisz swoją opinię" })).toBeInTheDocument();
    expect(screen.getByText("Twoja opinia została przywrócona po zalogowaniu.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Zapamiętana wersja robocza opinii")).toBeInTheDocument();

    clearReviewDraft();
  });
});
