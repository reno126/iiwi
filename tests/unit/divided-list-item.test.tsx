import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DividedListItem } from "@/components/ui/divided-list-item";

describe("components/ui/divided-list-item", () => {
  it("renders left and right slots inside a list item", () => {
    render(
      <ul>
        <DividedListItem
          left={<span>Po lewej</span>}
          right={<span>Po prawej</span>}
        />
      </ul>,
    );

    expect(screen.getByText("Po lewej")).toBeInTheDocument();
    expect(screen.getByText("Po prawej")).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toBeInTheDocument();
  });

  it("renders custom children", () => {
    render(
      <ul>
        <DividedListItem>
          <span data-testid="custom-child">Zawartość własna</span>
        </DividedListItem>
      </ul>,
    );

    expect(screen.getByTestId("custom-child")).toBeInTheDocument();
  });
});
