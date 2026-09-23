import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  StarRating,
  STAR_RATING_MESSAGES,
} from "@/components/reviews/StarRating";

describe("components/reviews/StarRating", () => {
  it("renders with accessible meter role and values matching default rating and maxStars", () => {
    render(<StarRating rating={4} maxStars={5} />);

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAccessibleName(STAR_RATING_MESSAGES.ariaLabel(4, 5));
    expect(meter).toHaveAttribute("aria-valuenow", "4");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "5");
  });

  it("supports rate prop as an alias for rating", () => {
    render(<StarRating rate={3.5} maxStars={5} />);

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAccessibleName(STAR_RATING_MESSAGES.ariaLabel(3.5, 5));
    expect(meter).toHaveAttribute("aria-valuenow", "3.5");
  });

  it("defaults to 0 rating and 5 maxStars when no rating is provided", () => {
    render(<StarRating />);

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAccessibleName(STAR_RATING_MESSAGES.ariaLabel(0, 5));
    expect(meter).toHaveAttribute("aria-valuenow", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "5");
  });

  it("renders correct number of filled and unfilled stars based on rounded rating", () => {
    render(<StarRating rating={3.2} maxStars={5} />);

    const meter = screen.getByRole("meter");
    const filledStars = meter.querySelectorAll('[data-state="filled"]');
    const emptyStars = meter.querySelectorAll('[data-state="empty"]');

    expect(filledStars).toHaveLength(3);
    expect(emptyStars).toHaveLength(2);
  });

  it("rounds rating to nearest whole number for star display", () => {
    render(<StarRating rating={4.6} maxStars={5} />);

    const meter = screen.getByRole("meter");
    const filledStars = meter.querySelectorAll('[data-state="filled"]');
    const emptyStars = meter.querySelectorAll('[data-state="empty"]');

    expect(filledStars).toHaveLength(5);
    expect(emptyStars).toHaveLength(0);
  });

  it("renders custom number of maxStars", () => {
    render(<StarRating rating={7} maxStars={10} />);

    const meter = screen.getByRole("meter");
    const filledStars = meter.querySelectorAll('[data-state="filled"]');
    const emptyStars = meter.querySelectorAll('[data-state="empty"]');

    expect(meter).toHaveAttribute("aria-valuemax", "10");
    expect(filledStars).toHaveLength(7);
    expect(emptyStars).toHaveLength(3);
  });

  it("does not render numeric text value by default (showValue = false)", () => {
    render(<StarRating rating={4.5} maxStars={5} />);

    expect(
      screen.queryByText(STAR_RATING_MESSAGES.formattedValue(4.5, 5)),
    ).not.toBeInTheDocument();
  });

  it("renders numeric formatted rating text when showValue is true", () => {
    render(<StarRating rating={4.5} maxStars={5} showValue />);

    expect(
      screen.getByText(STAR_RATING_MESSAGES.formattedValue(4.5, 5)),
    ).toBeInTheDocument();
  });

  it("applies size attribute for sm size", () => {
    render(<StarRating rating={3} size="sm" showValue />);

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("data-size", "sm");
    expect(
      screen.getByText(STAR_RATING_MESSAGES.formattedValue(3, 5)),
    ).toBeInTheDocument();
  });

  it("applies size attribute for md size", () => {
    render(<StarRating rating={3} size="md" showValue />);

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("data-size", "md");
    expect(
      screen.getByText(STAR_RATING_MESSAGES.formattedValue(3, 5)),
    ).toBeInTheDocument();
  });

  it("applies size attribute for lg size", () => {
    render(<StarRating rating={3} size="lg" />);

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("data-size", "lg");
  });
});
