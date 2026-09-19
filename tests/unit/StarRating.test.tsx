import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StarRating } from "@/components/reviews/StarRating";

describe("components/reviews/StarRating", () => {
  it("renders with accessible aria-label matching default rating and maxStars", () => {
    render(<StarRating rating={4} maxStars={5} />);

    const ratingContainer = screen.getByLabelText("Ocena: 4 na 5");
    expect(ratingContainer).toBeInTheDocument();
  });

  it("supports rate prop as an alias for rating", () => {
    render(<StarRating rate={3.5} maxStars={5} />);

    expect(screen.getByLabelText("Ocena: 3.5 na 5")).toBeInTheDocument();
  });

  it("defaults to 0 rating and 5 maxStars when no rating is provided", () => {
    render(<StarRating />);

    expect(screen.getByLabelText("Ocena: 0 na 5")).toBeInTheDocument();
  });

  it("renders correct number of filled and unfilled stars based on rounded rating", () => {
    const { container } = render(<StarRating rating={3.2} maxStars={5} />);

    const filledStars = container.querySelectorAll(".fill-amber-400");
    expect(filledStars).toHaveLength(3);

    const unfilledStars = container.querySelectorAll(
      ".text-muted-foreground\\/30",
    );
    expect(unfilledStars).toHaveLength(2);
  });

  it("rounds rating to nearest whole number for star display", () => {
    const { container } = render(<StarRating rating={4.6} maxStars={5} />);

    const filledStars = container.querySelectorAll(".fill-amber-400");
    expect(filledStars).toHaveLength(5);
  });

  it("renders custom number of maxStars", () => {
    const { container } = render(<StarRating rating={7} maxStars={10} />);

    expect(screen.getByLabelText("Ocena: 7 na 10")).toBeInTheDocument();

    const filledStars = container.querySelectorAll(".fill-amber-400");
    expect(filledStars).toHaveLength(7);

    const unfilledStars = container.querySelectorAll(
      ".text-muted-foreground\\/30",
    );
    expect(unfilledStars).toHaveLength(3);
  });

  it("does not render numeric text value by default (showValue = false)", () => {
    render(<StarRating rating={4.5} maxStars={5} />);

    expect(screen.queryByText("4.5 / 5")).not.toBeInTheDocument();
  });

  it("renders numeric formatted rating text when showValue is true", () => {
    render(<StarRating rating={4.5} maxStars={5} showValue />);

    expect(screen.getByText("4.5 / 5")).toBeInTheDocument();
  });

  it("applies size-specific classes for sm size", () => {
    const { container } = render(<StarRating rating={3} size="sm" showValue />);
    expect(container.querySelector(".size-4")).toBeInTheDocument();
    expect(screen.getByText("3.0 / 5")).toHaveClass("text-sm");
  });

  it("applies size-specific classes for md size", () => {
    const { container } = render(<StarRating rating={3} size="md" showValue />);
    expect(container.querySelector(".size-5")).toBeInTheDocument();
    expect(screen.getByText("3.0 / 5")).toHaveClass("text-base");
  });

  it("applies size-specific classes for lg size", () => {
    const { container } = render(<StarRating rating={3} size="lg" />);
    expect(container.querySelector(".size-6")).toBeInTheDocument();
  });
});
