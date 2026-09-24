import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ReadMore,
  READ_MORE_MESSAGES,
} from "@/app/produkty/[id]/_components/ReadMore";

describe("app/produkty/[id]/_components/ReadMore", () => {
  const originalScrollHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollHeight",
  );
  const originalClientHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientHeight",
  );

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        const text = this.textContent ?? "";
        if (text.length > 250 || text.split("\n").length > 2) {
          return 500;
        }
        return 50;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 100,
    });
  });

  afterEach(() => {
    if (originalScrollHeight) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollHeight",
        originalScrollHeight,
      );
    }
    if (originalClientHeight) {
      Object.defineProperty(
        HTMLElement.prototype,
        "clientHeight",
        originalClientHeight,
      );
    }
  });
  it("renders null when both text and children are missing or empty", () => {
    const { container } = render(<ReadMore />);
    expect(container.firstChild).toBeNull();
  });

  it("renders short text without any expand/collapse button", () => {
    render(
      <ReadMore text="To jest krótki opis produktu, który nie wymaga zwijania." />,
    );

    expect(
      screen.getByText(
        "To jest krótki opis produktu, który nie wymaga zwijania.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders children when text prop is not provided", () => {
    render(<ReadMore>Opis przekazany przez children</ReadMore>);

    expect(
      screen.getByText("Opis przekazany przez children"),
    ).toBeInTheDocument();
  });

  it("displays 'Czytaj więcej' button when text exceeds 250 characters", () => {
    const longText = "A".repeat(260);
    render(<ReadMore text={longText} />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("displays 'Czytaj więcej' button when text contains more lines than maxLines", () => {
    const multilineText = "Linia 1\nLinia 2\nLinia 3\nLinia 4";
    render(<ReadMore text={multilineText} maxLines={2} />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("toggles expanded and collapsed states when clicking trigger button", async () => {
    const user = userEvent.setup();
    const longText = "To jest bardzo długa recenzja produktu. ".repeat(15);

    render(<ReadMore text={longText} />);

    const triggerButton = screen.getByRole("button");
    expect(triggerButton).toBeInTheDocument();

    await user.click(triggerButton);
    expect(triggerButton).toHaveTextContent(READ_MORE_MESSAGES.lessLabel);

    await user.click(triggerButton);
    expect(triggerButton).toHaveTextContent(READ_MORE_MESSAGES.moreLabel);
  });

  it("supports custom moreLabel and lessLabel props", async () => {
    const user = userEvent.setup();
    const longText = "Tekst o znacznej długości. ".repeat(15);
    const moreLabel = "Pokaż pełną treść";
    const lessLabel = "Ukryj szczegóły";

    render(
      <ReadMore text={longText} moreLabel={moreLabel} lessLabel={lessLabel} />,
    );

    const triggerButton = screen.getByRole("button");
    expect(triggerButton).toHaveTextContent(moreLabel);

    await user.click(triggerButton);
    expect(triggerButton).toHaveTextContent(lessLabel);
  });

  it("applies corresponding clamp class based on maxLines prop", () => {
    const longText = "Treść wieloliniowa. ".repeat(20);
    render(<ReadMore text={longText} maxLines={3} />);

    expect(screen.getByText(longText.trim())).toHaveClass("line-clamp-3");
  });
});
