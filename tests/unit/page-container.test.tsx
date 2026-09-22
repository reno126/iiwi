import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageContainer } from "@/components/ui/page-container";

const TEST_CONTENT = "Zawartość kontenera strony";

describe("components/ui/page-container", () => {
  it("renders PageContainer with default size and slot", () => {
    render(<PageContainer>{TEST_CONTENT}</PageContainer>);

    const containerElement = screen.getByText(TEST_CONTENT);
    expect(containerElement).toBeInTheDocument();
    expect(containerElement).toHaveAttribute("data-slot", "page-container");
    expect(containerElement).toHaveAttribute("data-size", "default");
    expect(containerElement).toHaveClass("max-w-4xl");
    expect(containerElement).toHaveClass("flex");
    expect(containerElement).toHaveClass("flex-col");
  });

  it("applies sm size when specified", () => {
    render(<PageContainer size="sm">{TEST_CONTENT}</PageContainer>);

    const containerElement = screen.getByText(TEST_CONTENT);
    expect(containerElement).toHaveAttribute("data-size", "sm");
    expect(containerElement).toHaveClass("max-w-2xl");
  });

  it("applies auth size when specified", () => {
    render(<PageContainer size="auth">{TEST_CONTENT}</PageContainer>);

    const containerElement = screen.getByText(TEST_CONTENT);
    expect(containerElement).toHaveAttribute("data-size", "auth");
    expect(containerElement).toHaveClass("justify-center");
  });
});
