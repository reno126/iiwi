import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Heading,
  HeadingDescription,
  HeadingGroup,
} from "@/components/ui/heading";

const TEST_TEXTS = {
  mainTitle: "Tytuł główny",
  sectionTitle: "Tytuł sekcji",
  customAsTitle: "Nagłówek jako akapit",
  descriptionText: "Opis uzupełniający do nagłówka",
} as const;

describe("components/ui/heading", () => {
  it("renders h2 heading with level 2 by default", () => {
    render(<Heading>{TEST_TEXTS.mainTitle}</Heading>);

    const headingElement = screen.getByRole("heading", { level: 2 });
    expect(headingElement).toBeInTheDocument();
    expect(headingElement).toHaveTextContent(TEST_TEXTS.mainTitle);
    expect(headingElement).toHaveAttribute("data-slot", "heading");
    expect(headingElement).toHaveAttribute("data-level", "2");
  });

  it("renders h1 when level 1 is specified", () => {
    render(<Heading level={1}>{TEST_TEXTS.mainTitle}</Heading>);

    const headingElement = screen.getByRole("heading", { level: 1 });
    expect(headingElement).toBeInTheDocument();
    expect(headingElement).toHaveTextContent(TEST_TEXTS.mainTitle);
    expect(headingElement).toHaveAttribute("data-level", "1");
  });

  it("renders custom element when as prop is provided", () => {
    render(
      <Heading level={1} as="p">
        {TEST_TEXTS.customAsTitle}
      </Heading>,
    );

    expect(screen.getByText(TEST_TEXTS.customAsTitle).tagName).toBe("P");
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("renders HeadingDescription with paragraph tag and description slot", () => {
    render(
      <HeadingDescription>{TEST_TEXTS.descriptionText}</HeadingDescription>,
    );

    const descriptionElement = screen.getByText(TEST_TEXTS.descriptionText);
    expect(descriptionElement).toBeInTheDocument();
    expect(descriptionElement.tagName).toBe("P");
    expect(descriptionElement).toHaveAttribute(
      "data-slot",
      "heading-description",
    );
  });

  it("renders HeadingGroup wrapping heading and description", () => {
    render(
      <HeadingGroup align="responsive" spacing="default">
        <Heading level={2}>{TEST_TEXTS.sectionTitle}</Heading>
        <HeadingDescription>{TEST_TEXTS.descriptionText}</HeadingDescription>
      </HeadingGroup>,
    );

    const groupElement = screen.getByText(
      TEST_TEXTS.sectionTitle,
    ).parentElement;
    expect(groupElement).toHaveAttribute("data-slot", "heading-group");
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.getByText(TEST_TEXTS.descriptionText)).toBeInTheDocument();
  });
});
