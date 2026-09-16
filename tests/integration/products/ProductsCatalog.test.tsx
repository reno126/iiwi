import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/serverActions/productsGet", () => ({
  productsGet: vi.fn(),
}));

import { productsGet } from "@/serverActions/productsGet";
import ProductsPage from "@/app/produkty/page";
import { ProductsListSection } from "@/app/produkty/_components/ProductsListSection";
import { ProductsPagination } from "@/app/produkty/_components/ProductsPagination";

describe("app/produkty (Products Catalog)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProducts = [
    {
      id: "prod-1",
      name: "Słuchawki Sony WH-1000XM5",
      code: "SONY-01",
      imageUrl: "https://example.com/sony.jpg",
      rate_avg: 4.8,
      rate_count: 12,
      createdAt: new Date("2026-01-01"),
      shop: { name: "Media Expert" },
    },
    {
      id: "prod-2",
      name: "Myszka Logitech MX Master 3S",
      code: null,
      imageUrl: null,
      rate_avg: 0,
      rate_count: 0,
      createdAt: new Date("2026-01-02"),
      shop: null,
    },
  ];

  it("renders page header and link to add new review", async () => {
    vi.mocked(productsGet).mockResolvedValueOnce({
      products: mockProducts,
      totalCount: 2,
      totalPages: 1,
      currentPage: 1,
      pageSize: 20,
    });

    const pageJsx = await ProductsPage({
      searchParams: Promise.resolve({ page: "1" }),
    });

    render(pageJsx);

    expect(screen.getByRole("heading", { level: 1, name: /produkty/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dodaj opinię/i })).toHaveAttribute("href", "/opinie/dodaj");
  });

  it("renders product cards with names, badges, review count, and links to details", async () => {
    vi.mocked(productsGet).mockResolvedValueOnce({
      products: mockProducts,
      totalCount: 2,
      totalPages: 1,
      currentPage: 1,
      pageSize: 20,
    });

    const sectionJsx = await ProductsListSection({ page: 1 });
    render(sectionJsx);

    expect(screen.getByText("Słuchawki Sony WH-1000XM5")).toBeInTheDocument();
    expect(screen.getByText("SONY-01")).toBeInTheDocument();
    expect(screen.getByText("12 opinii")).toBeInTheDocument();
    expect(screen.getByText("Media Expert")).toBeInTheDocument();

    expect(screen.getByText("Myszka Logitech MX Master 3S")).toBeInTheDocument();
    expect(screen.getByText("0 opinii")).toBeInTheDocument();

    const sonyLink = screen.getByText("Słuchawki Sony WH-1000XM5").closest("a");
    expect(sonyLink).toHaveAttribute("href", "/produkty/prod-1");

    const logitechLink = screen.getByText("Myszka Logitech MX Master 3S").closest("a");
    expect(logitechLink).toHaveAttribute("href", "/produkty/prod-2");
  });

  it("renders empty state when no products are found in database", async () => {
    vi.mocked(productsGet).mockResolvedValueOnce({
      products: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: 20,
    });

    const sectionJsx = await ProductsListSection({ page: 1 });
    render(sectionJsx);

    expect(screen.getByText("Brak produktów")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dodaj produkt i opinię/i })).toHaveAttribute(
      "href",
      "/opinie/dodaj",
    );
  });

  describe("ProductsPagination", () => {
    it("renders nothing when totalPages is 1 or less", () => {
      const { container } = render(<ProductsPagination currentPage={1} totalPages={1} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders pagination controls for page 1 of 3 with disabled previous button", () => {
      render(<ProductsPagination currentPage={1} totalPages={3} />);

      const nav = screen.getByRole("navigation", { name: /nawigacja stronami/i });
      expect(nav).toBeInTheDocument();

      const page1Btn = screen.getByRole("link", { name: "1" });
      expect(page1Btn).toHaveAttribute("aria-current", "page");

      const page2Btn = screen.getByRole("link", { name: "2" });
      expect(page2Btn).toHaveAttribute("href", "/produkty?page=2");

      const nextLink = screen.getByLabelText(/przejdź do następnej strony/i);
      expect(nextLink).toHaveAttribute("href", "/produkty?page=2");

      expect(screen.queryByLabelText(/przejdź do poprzedniej strony/i)).not.toBeInTheDocument();
    });

    it("renders pagination controls for middle page (2 of 3) with active previous and next links", () => {
      render(<ProductsPagination currentPage={2} totalPages={3} />);

      const prevLink = screen.getByLabelText(/przejdź do poprzedniej strony/i);
      expect(prevLink).toHaveAttribute("href", "/produkty?page=1");

      const page2Btn = screen.getByRole("link", { name: "2" });
      expect(page2Btn).toHaveAttribute("aria-current", "page");

      const nextLink = screen.getByLabelText(/przejdź do następnej strony/i);
      expect(nextLink).toHaveAttribute("href", "/produkty?page=3");
    });

    it("renders pagination controls for last page (3 of 3) with disabled next button", () => {
      render(<ProductsPagination currentPage={3} totalPages={3} />);

      const prevLink = screen.getByLabelText(/przejdź do poprzedniej strony/i);
      expect(prevLink).toHaveAttribute("href", "/produkty?page=2");

      const page3Btn = screen.getByRole("link", { name: "3" });
      expect(page3Btn).toHaveAttribute("aria-current", "page");

      expect(screen.queryByLabelText(/przejdź do następnej strony/i)).not.toBeInTheDocument();
    });
  });
});
