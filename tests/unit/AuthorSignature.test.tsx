import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AuthorSignature,
  AuthorSignatureSkeleton,
} from "@/components/reviews/AuthorSignature";

describe("components/reviews/AuthorSignature", () => {
  it("renders display name with user initial fallback", () => {
    render(<AuthorSignature name="Jan Kowalski" email="jan@example.com" />);

    expect(screen.getByText("Jan Kowalski")).toBeInTheDocument();
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders formatted date when provided", () => {
    const creationDate = new Date("2026-04-12T10:00:00.000Z");
    render(
      <AuthorSignature
        name="Jan Kowalski"
        email="jan@example.com"
        date={creationDate}
      />,
    );

    expect(screen.getByText("12 kwietnia 2026")).toBeInTheDocument();
  });

  it("renders skeleton placeholder via AuthorSignatureSkeleton", () => {
    const { container } = render(<AuthorSignatureSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
