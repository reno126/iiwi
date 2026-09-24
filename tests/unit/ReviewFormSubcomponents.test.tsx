import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectedProductCard } from "@/app/opinie/dodaj/_components/SelectedProductCard";
import { StickyFormActionBar } from "@/components/ui/sticky-form-action-bar";
import {
  ScrapeDelayNotice,
  SCRAPE_DELAY_MESSAGES,
} from "@/app/opinie/dodaj/_components/ScrapeDelayNotice";
import type { Product } from "@/prisma/generated/client";

describe("app/opinie/dodaj/_components/SelectedProductCard", () => {
  const mockProduct: Product = {
    id: "prod-sel-1",
    name: "Klawiatura Mechaniczna",
    productUrl: "https://example.com/kbd",
    imageUrl: "https://example.com/kbd.jpg",
    code: "KEY-01",
    creatorId: "user-1",
    shopId: null,
    rate_avg: 4.5,
    rate_count: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("renders product name, code badge, and 'Wybrany produkt' badge", () => {
    render(<SelectedProductCard product={mockProduct} onReselect={vi.fn()} />);

    expect(screen.getByText("Klawiatura Mechaniczna")).toBeInTheDocument();
    expect(screen.getByText("Kod: KEY-01")).toBeInTheDocument();
    expect(screen.getByText("Wybrany produkt")).toBeInTheDocument();
  });

  it("calls onReselect callback when clicking 'Zmień produkt' button", async () => {
    const user = userEvent.setup();
    const onReselectMock = vi.fn();

    render(
      <SelectedProductCard product={mockProduct} onReselect={onReselectMock} />,
    );

    const changeButton = screen.getByRole("button");
    await user.click(changeButton);

    expect(onReselectMock).toHaveBeenCalledTimes(1);
  });
});

describe("app/opinie/dodaj/_components/StickyFormActionBar", () => {
  it("renders default submit button with label 'Zapisz'", () => {
    render(<StickyFormActionBar />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("supports custom submitLabel and calls onBack and onCancel", async () => {
    const user = userEvent.setup();
    const onBackMock = vi.fn();
    const onCancelMock = vi.fn();
    const submitLabel = "Wyślij recenzję";
    const backLabel = "Poprzedni krok";
    const cancelLabel = "Porzuć zmiany";

    render(
      <StickyFormActionBar
        submitLabel={submitLabel}
        onBack={onBackMock}
        backLabel={backLabel}
        onCancel={onCancelMock}
        cancelLabel={cancelLabel}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: submitLabel });
    expect(submitBtn).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: backLabel });
    await user.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole("button", { name: cancelLabel });
    await user.click(cancelBtn);
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it("disables all action buttons and displays spinner when isSubmitting is true", () => {
    render(
      <StickyFormActionBar onBack={vi.fn()} onCancel={vi.fn()} isSubmitting />,
    );

    const buttons = screen.getAllByRole("button");
    for (const actionButton of buttons) {
      expect(actionButton).toBeDisabled();
    }

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

describe("app/opinie/dodaj/_components/ScrapeDelayNotice", () => {
  it("renders null when isVisible is false", () => {
    const { container } = render(<ScrapeDelayNotice isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders default delay message and spinner when isVisible is true", () => {
    render(<ScrapeDelayNotice isVisible />);

    expect(
      screen.getByText(SCRAPE_DELAY_MESSAGES.defaultDelay),
    ).toBeInTheDocument();
  });

  it("renders custom message when message prop is provided", () => {
    render(
      <ScrapeDelayNotice
        isVisible
        message="Przeszukiwanie bazy sklepu trwa dłużej niż zwykle..."
      />,
    );

    expect(
      screen.getByText("Przeszukiwanie bazy sklepu trwa dłużej niż zwykle..."),
    ).toBeInTheDocument();
  });
});
