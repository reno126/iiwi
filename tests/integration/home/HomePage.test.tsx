import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import HomePage from "@/app/page";
import * as recentReviewsGetModule from "@/serverActions/recentReviewsGet";
import * as shopsGetModule from "@/serverActions/shopsGet";

vi.mock("@/serverActions/recentReviewsGet", () => ({
  recentReviewsGet: vi.fn(),
}));

vi.mock("@/serverActions/shopsGet", () => ({
  shopsGet: vi.fn(),
}));

describe("HomePage", () => {
  it("renders all sections one-below-one according to requirements", async () => {
    vi.mocked(recentReviewsGetModule.recentReviewsGet).mockResolvedValue([
      {
        id: "rev-1",
        description: "Doskonały produkt, bardzo polecam!",
        rate: 5,
        createdAt: new Date("2026-09-02"),
        user: { name: "Jan Tester" },
        product: {
          id: "prod-1",
          name: "Testowy Produkt 1",
          code: "SKU-001",
          imageUrl: "https://example.com/img1.jpg",
          rate_avg: 4.5,
          rate_count: 2,
          shop: { name: "Media Expert" },
        },
      },
      {
        id: "rev-2",
        description: "Całkiem w porządku",
        rate: 3,
        createdAt: new Date("2026-09-03"),
        user: { name: "Anna" },
        product: {
          id: "prod-2",
          name: "Testowy Produkt 2",
          code: null,
          imageUrl: null,
          rate_avg: 3.0,
          rate_count: 1,
          shop: { name: "Allegro" },
        },
      },
    ]);

    vi.mocked(shopsGetModule.shopsGet).mockResolvedValue([
      {
        id: "shop-1",
        name: "Media Expert",
        logo: "/images/shops/mediaexpert.svg",
      },
      {
        id: "shop-2",
        name: "Allegro",
        logo: "/images/shops/allegro.svg",
      },
    ]);

    await act(async () => {
      render(<HomePage />);
    });

    expect(
      screen.getByRole("heading", {
        name: /tylko tutaj znajdziesz prawdziwe, całkowicie niezależne opinie o produktach/i,
      }),
    ).toBeInTheDocument();

    const viewAllLink = screen.getByRole("link", {
      name: /zobacz wszystkie opinie/i,
    });
    expect(viewAllLink).toHaveAttribute("href", "/produkty");

    const addReviewLinks = screen.getAllByRole("link", {
      name: /dodaj opinię/i,
    });
    expect(addReviewLinks.length).toBeGreaterThanOrEqual(2);
    addReviewLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/opinie/dodaj");
    });

    expect(
      screen.getByRole("heading", { name: /ostatnio dodane opinie/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/testowy produkt 1/i)).toBeInTheDocument();
    expect(await screen.findByText(/testowy produkt 2/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/doskonały produkt, bardzo polecam!/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/jan tester/i)).toBeInTheDocument();

    expect(recentReviewsGetModule.recentReviewsGet).toHaveBeenCalledWith(3);

    expect(
      screen.getByRole("heading", {
        name: /opinie z dowolnych sklepów stacjonarnych i internetowych/i,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/popularne sklepy/i)).toBeInTheDocument();

    expect((await screen.findAllByText(/media expert/i)).length).toBeGreaterThanOrEqual(1);
    expect((await screen.findAllByText(/allegro/i)).length).toBeGreaterThanOrEqual(1);
  });
});
