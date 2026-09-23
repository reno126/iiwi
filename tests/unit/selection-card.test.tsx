import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SelectionCard } from "@/components/ui/selection-card";

describe("components/ui/selection-card", () => {
  it("renders title, badge, description, media, and actions", () => {
    render(
      <SelectionCard
        media={<span data-testid="test-media">Media</span>}
        title="Testowy produkt"
        badge={<span>Etykieta</span>}
        description="Dodatkowy opis"
        actions={<button type="button">Zmień</button>}
      />,
    );

    expect(screen.getByText("Testowy produkt")).toBeInTheDocument();
    expect(screen.getByText("Etykieta")).toBeInTheDocument();
    expect(screen.getByText("Dodatkowy opis")).toBeInTheDocument();
    expect(screen.getByTestId("test-media")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("applies primary variant styling correctly", () => {
    const { container } = render(
      <SelectionCard variant="primary" title="Produkt wariantu primary" />,
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass("bg-primary/5");
    expect(cardElement).toHaveClass("border-primary/40");
  });

  it("renders children when provided", () => {
    render(
      <SelectionCard title="Karta z dziećmi">
        <span data-testid="custom-child">Dodatkowa treść</span>
      </SelectionCard>,
    );

    expect(screen.getByTestId("custom-child")).toBeInTheDocument();
  });
});
