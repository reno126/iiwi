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
    render(<StarRating rating={3.2} maxStars={5} />);

    const ratingContainer = screen.getByLabelText("Ocena: 3.2 na 5");
    const stars = ratingContainer.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    expect(stars[0]).toHaveClass("fill-amber-400");
    expect(stars[1]).toHaveClass("fill-amber-400");
    expect(stars[2]).toHaveClass("fill-amber-400");
    expect(stars[3]).toHaveClass("text-muted-foreground/30");
    expect(stars[4]).toHaveClass("text-muted-foreground/30");
  });

  it("rounds rating to nearest whole number for star display", () => {
    render(<StarRating rating={4.6} maxStars={5} />);

    const ratingContainer = screen.getByLabelText("Ocena: 4.6 na 5");
    const stars = ratingContainer.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    for (const star of stars) {
      expect(star).toHaveClass("fill-amber-400");
    }
  });

  it("renders custom number of maxStars", () => {
    render(<StarRating rating={7} maxStars={10} />);

    const ratingContainer = screen.getByLabelText("Ocena: 7 na 10");
    const stars = ratingContainer.querySelectorAll("svg");
    expect(stars).toHaveLength(10);
    expect(stars[6]).toHaveClass("fill-amber-400");
    expect(stars[7]).toHaveClass("text-muted-foreground/30");
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
    render(<StarRating rating={3} size="sm" showValue />);
    const ratingContainer = screen.getByLabelText("Ocena: 3 na 5");
    const star = ratingContainer.querySelector("svg");
    expect(star).toHaveClass("size-4");
    expect(screen.getByText("3.0 / 5")).toHaveClass("text-sm");
  });

  it("applies size-specific classes for md size", () => {
    render(<StarRating rating={3} size="md" showValue />);
    const ratingContainer = screen.getByLabelText("Ocena: 3 na 5");
    const star = ratingContainer.querySelector("svg");
    expect(star).toHaveClass("size-5");
    expect(screen.getByText("3.0 / 5")).toHaveClass("text-base");
  });

  it("applies size-specific classes for lg size", () => {
    render(<StarRating rating={3} size="lg" />);
    const ratingContainer = screen.getByLabelText("Ocena: 3 na 5");
    const star = ratingContainer.querySelector("svg");
    expect(star).toHaveClass("size-6");
  });
});
