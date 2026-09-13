import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

    const pageElement = await HomePage();
    render(pageElement);

    // 1. Big hero text
    expect(
      screen.getByRole("heading", {
        name: /Tylko tutaj znajdziesz prawdziwe, całkowicie niezależne opinie o produktach/i,
      }),
    ).toBeInTheDocument();

    // 2. Section without title with 2 buttons: "Zobacz wszystkie opinie" and "Dodaj opinię"
    const viewAllLink = screen.getByRole("link", { name: "Zobacz wszystkie opinie" });
    expect(viewAllLink).toHaveAttribute("href", "/produkty");

    const addReviewLinks = screen.getAllByRole("link", { name: "Dodaj opinię" });
    // There are two "Dodaj opinię" buttons (one in section 2, one in section 5)
    expect(addReviewLinks.length).toBeGreaterThanOrEqual(2);
    addReviewLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/opinie/dodaj");
    });

    // 3. Banner with 3 static, latest reviews: title "Ostatnio dodane opinie"
    expect(
      screen.getByRole("heading", { name: "Ostatnio dodane opinie" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Testowy Produkt 1")).toBeInTheDocument();
    expect(screen.getByText("Testowy Produkt 2")).toBeInTheDocument();
    expect(
      screen.getByText("“Doskonały produkt, bardzo polecam!”"),
    ).toBeInTheDocument();
    expect(screen.getByText("Jan Tester")).toBeInTheDocument();

    // Verify recentReviewsGet was called with limit 3
    expect(recentReviewsGetModule.recentReviewsGet).toHaveBeenCalledWith(3);

    // 4. Shop tiles: title "Opinie z dowolnych sklepów stacjonarnych i internetowych", subtitle "Popularne sklepy"
    expect(
      screen.getByRole("heading", {
        name: "Opinie z dowolnych sklepów stacjonarnych i internetowych",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Popularne sklepy")).toBeInTheDocument();

    // Verify shop names and logos are rendered
    expect(screen.getAllByText("Media Expert").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Allegro").length).toBeGreaterThanOrEqual(1);
  });
});
