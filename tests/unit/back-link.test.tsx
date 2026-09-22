import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BackLink, BackButton } from "@/components/ui/back-link";

const TEST_MESSAGES = {
  linkText: "Wróć do listy",
  buttonText: "Wróć do poprzedniego kroku",
} as const;

describe("components/ui/back-link", () => {
  it("renders BackLink with correct link role, href, and slot", () => {
    render(<BackLink href="/produkty">{TEST_MESSAGES.linkText}</BackLink>);

    const linkElement = screen.getByRole("link", {
      name: TEST_MESSAGES.linkText,
    });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute("href", "/produkty");
    expect(linkElement).toHaveAttribute("data-slot", "back-link");
  });

  it("renders BackButton with correct button role and slot", () => {
    render(<BackButton>{TEST_MESSAGES.buttonText}</BackButton>);

    const buttonElement = screen.getByRole("button", {
      name: TEST_MESSAGES.buttonText,
    });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveAttribute("data-slot", "back-button");
  });
});
