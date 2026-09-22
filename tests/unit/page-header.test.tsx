import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  PageHeader,
  PageHeaderActions,
  SectionHeader,
  SectionHeaderActions,
} from "@/components/ui/page-header";

const TEST_MESSAGES = {
  headerContent: "Treść nagłówka strony",
  actionButton: "Dodaj nowy element",
  sectionContent: "Treść nagłówka sekcji",
  sectionAction: "Zobacz więcej",
} as const;

describe("components/ui/page-header", () => {
  it("renders PageHeader as header element with correct slot", () => {
    render(
      <PageHeader>
        <h1>{TEST_MESSAGES.headerContent}</h1>
      </PageHeader>,
    );

    const headerElement = screen.getByRole("banner");
    expect(headerElement).toBeInTheDocument();
    expect(headerElement).toHaveAttribute("data-slot", "page-header");
    expect(headerElement).toHaveTextContent(TEST_MESSAGES.headerContent);
  });

  it("applies bordered styling to PageHeader when bordered is true", () => {
    const { container } = render(
      <PageHeader bordered={true}>
        <h1>{TEST_MESSAGES.headerContent}</h1>
      </PageHeader>,
    );

    const headerElement = container.querySelector("header");
    expect(headerElement).toHaveClass("border-b");
    expect(headerElement).toHaveClass("border-border");
  });

  it("renders PageHeaderActions with slot", () => {
    render(
      <PageHeader>
        <h1>{TEST_MESSAGES.headerContent}</h1>
        <PageHeaderActions>
          <button type="button">{TEST_MESSAGES.actionButton}</button>
        </PageHeaderActions>
      </PageHeader>,
    );

    const actionButton = screen.getByRole("button", {
      name: TEST_MESSAGES.actionButton,
    });
    expect(actionButton).toBeInTheDocument();
    expect(actionButton.parentElement).toHaveAttribute(
      "data-slot",
      "page-header-actions",
    );
  });

  it("renders SectionHeader and SectionHeaderActions with slots and borders", () => {
    const { container } = render(
      <SectionHeader bordered={true}>
        <h2>{TEST_MESSAGES.sectionContent}</h2>
        <SectionHeaderActions>
          <button type="button">{TEST_MESSAGES.sectionAction}</button>
        </SectionHeaderActions>
      </SectionHeader>,
    );

    const sectionHeader = container.querySelector(
      "[data-slot='section-header']",
    );
    expect(sectionHeader).toBeInTheDocument();
    expect(sectionHeader).toHaveClass("border-b");

    const sectionActionButton = screen.getByRole("button", {
      name: TEST_MESSAGES.sectionAction,
    });
    expect(sectionActionButton.parentElement).toHaveAttribute(
      "data-slot",
      "section-header-actions",
    );
  });
});
