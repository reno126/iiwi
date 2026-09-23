import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RatingSummary } from "@/components/reviews/RatingSummary";

describe("components/reviews/RatingSummary", () => {
  it("renders star rating and formatted count when reviews exist", () => {
    render(<RatingSummary rate={4.5} count={12} />);

    expect(screen.getByText("4.5 / 5")).toBeInTheDocument();
    expect(screen.getByText("12 opinii")).toBeInTheDocument();
  });

  it("renders empty text when count is 0 and showEmptyText is true", () => {
    render(
      <RatingSummary
        rate={0}
        count={0}
        showEmptyText={true}
        emptyText="Brak ocen produktu"
      />,
    );

    expect(screen.getByText("Brak ocen produktu")).toBeInTheDocument();
  });
});
