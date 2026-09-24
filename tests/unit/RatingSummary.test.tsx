import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  RatingSummary,
  RATING_SUMMARY_MESSAGES,
} from "@/components/reviews/RatingSummary";
import { formatReviewCount } from "@/lib/formatters";
import { STAR_RATING_MESSAGES } from "@/components/reviews/StarRating";

describe("components/reviews/RatingSummary", () => {
  it("renders star rating and formatted count when reviews exist", () => {
    render(<RatingSummary rate={4.5} count={12} />);

    expect(
      screen.getByText(STAR_RATING_MESSAGES.formattedValue(4.5, 5)),
    ).toBeInTheDocument();
    expect(screen.getByText(formatReviewCount(12))).toBeInTheDocument();
  });

  it("renders default empty text when count is 0 and showEmptyText is true", () => {
    render(<RatingSummary rate={0} count={0} showEmptyText={true} />);

    expect(
      screen.getByText(RATING_SUMMARY_MESSAGES.defaultEmptyText),
    ).toBeInTheDocument();
  });

  it("renders custom empty text when count is 0 and emptyText prop is provided", () => {
    const customEmptyText = "Brak ocen produktu";
    render(
      <RatingSummary
        rate={0}
        count={0}
        showEmptyText={true}
        emptyText={customEmptyText}
      />,
    );

    expect(screen.getByText(customEmptyText)).toBeInTheDocument();
  });
});
