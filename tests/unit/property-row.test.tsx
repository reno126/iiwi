import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyRow } from "@/components/ui/property-row";
import { Calendar } from "lucide-react";

describe("components/ui/property-row", () => {
  it("renders label and value in standard div mode", () => {
    render(<PropertyRow icon={Calendar} label="Data:" value="2026-05-10" />);

    expect(screen.getByText("Data:")).toBeInTheDocument();
    expect(screen.getByText("2026-05-10")).toBeInTheDocument();
  });

  it("renders semantic definition list elements when semantic is dl", () => {
    const { container } = render(
      <dl>
        <PropertyRow semantic="dl" label="Twórca:" value="Jan Kowalski" />
      </dl>,
    );

    const termElement = container.querySelector("dt");
    const definitionElement = container.querySelector("dd");

    expect(termElement).toBeInTheDocument();
    expect(termElement).toHaveTextContent("Twórca:");
    expect(definitionElement).toBeInTheDocument();
    expect(definitionElement).toHaveTextContent("Jan Kowalski");
  });

  it("renders children alongside value", () => {
    render(
      <PropertyRow label="Link:">
        <a href="https://example.com">Odwiedź sklep</a>
      </PropertyRow>,
    );

    expect(screen.getByRole("link")).toBeInTheDocument();
  });
});
