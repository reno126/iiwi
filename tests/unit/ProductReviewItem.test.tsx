import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductReviewItem } from "@/app/produkty/[id]/_components/ProductReviewItem";
import { STAR_RATING_MESSAGES } from "@/components/reviews/StarRating";

describe("app/produkty/[id]/_components/ProductReviewItem", () => {
  const mockReview = {
    id: "review-test-1",
    rate: 4,
    description: "Świetny produkt, polecam każdemu użytkownikowi.",
    createdAt: new Date("2026-05-15T12:00:00Z"),
    user: {
      name: "Jan Kowalski",
      email: "jan.kowalski@example.com",
    },
  };

  it("renders review with author, description, and visible rating value", () => {
    render(<ProductReviewItem review={mockReview} />);

    expect(screen.getByText("Jan Kowalski")).toBeInTheDocument();
    expect(
      screen.getByText("Świetny produkt, polecam każdemu użytkownikowi."),
    ).toBeInTheDocument();

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAccessibleName(STAR_RATING_MESSAGES.ariaLabel(4, 5));
    expect(
      screen.getByText(STAR_RATING_MESSAGES.formattedValue(4, 5)),
    ).toBeInTheDocument();
  });
});
