import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signOut } from "next-auth/react";
import { UserProfileCard } from "@/app/dashboard/_components/UserProfileCard";
import { UserProductStats } from "@/app/dashboard/_components/UserProductStats";
import { UserShopStats } from "@/app/dashboard/_components/UserShopStats";
import { DashboardActions } from "@/app/dashboard/_components/DashboardActions";
import { DASHBOARD_MESSAGES } from "@/app/dashboard/constants";
import {
  formatPolishDate,
  formatRatedProductsCount,
  formatReviewCount,
} from "@/lib/formatters";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("app/dashboard components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UserProfileCard", () => {
    it("renders user greeting with full name, email, and formatted creation date", () => {
      const createdAt = new Date("2026-01-15T12:00:00.000Z");
      render(
        <UserProfileCard
          name="Jan Kowalski"
          email="jan@example.com"
          createdAt={createdAt}
        />,
      );

      expect(
        screen.getByRole("heading", {
          name: `${DASHBOARD_MESSAGES.greetingPrefix} Jan Kowalski`,
        }),
      ).toBeInTheDocument();
      expect(screen.getByText("jan@example.com")).toBeInTheDocument();
      expect(screen.getByText(formatPolishDate(createdAt))).toBeInTheDocument();
    });

    it("falls back to email prefix when user name is null", () => {
      render(
        <UserProfileCard
          name={null}
          email="marek@example.com"
          createdAt={new Date("2026-03-01T12:00:00.000Z")}
        />,
      );

      expect(
        screen.getByRole("heading", {
          name: `${DASHBOARD_MESSAGES.greetingPrefix} marek`,
        }),
      ).toBeInTheDocument();
    });
  });

  describe("UserProductStats", () => {
    it("renders dynamic product counter and product links without /5 and with count for multiple reviews", () => {
      const mockProducts = [
        {
          productId: "prod-1",
          productName: "Ekspres DeLonghi",
          rate: 4.5,
          userReviewsCount: 2,
        },
        {
          productId: "prod-2",
          productName: "Klawiatura MX Keys",
          rate: 5,
          userReviewsCount: 1,
        },
      ];

      render(
        <UserProductStats
          totalReviewedProducts={2}
          reviewedProducts={mockProducts}
        />,
      );

      expect(
        screen.getByRole("heading", {
          name: DASHBOARD_MESSAGES.statsHeading,
        }),
      ).toBeInTheDocument();
      expect(screen.getByText(formatRatedProductsCount(2))).toBeInTheDocument();

      const productLink1 = screen.getByRole("link", {
        name: /ekspres delonghi/i,
      });
      expect(productLink1).toHaveAttribute("href", "/produkty/prod-1");

      const productLink2 = screen.getByRole("link", {
        name: /klawiatura mx keys/i,
      });
      expect(productLink2).toHaveAttribute("href", "/produkty/prod-2");

      expect(
        screen.getByText(`(${DASHBOARD_MESSAGES.userRatingsLabel} 2)`),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(`(${DASHBOARD_MESSAGES.userRatingsLabel} 1)`),
      ).not.toBeInTheDocument();

      expect(screen.getByText("4.5")).toBeInTheDocument();
      expect(screen.getByText("5.0")).toBeInTheDocument();
      expect(screen.queryByText(/4\.5\/5/)).not.toBeInTheDocument();
      expect(screen.queryByText(/5\.0\/5/)).not.toBeInTheDocument();
    });

    it("renders empty state when user has not rated any products", () => {
      render(
        <UserProductStats totalReviewedProducts={0} reviewedProducts={[]} />,
      );

      expect(screen.getByText(formatRatedProductsCount(0))).toBeInTheDocument();
      expect(
        screen.getByText(DASHBOARD_MESSAGES.emptyProductsMessage),
      ).toBeInTheDocument();
    });
  });

  describe("UserShopStats", () => {
    it("renders shops heading and list of shops with formatted review counts", () => {
      const mockShops = [
        { shopName: "Media Expert", reviewCount: 3 },
        { shopName: "Allegro", reviewCount: 1 },
      ];

      render(<UserShopStats reviewedShops={mockShops} />);

      expect(
        screen.getByRole("heading", { name: DASHBOARD_MESSAGES.shopsHeading }),
      ).toBeInTheDocument();
      expect(screen.getByText("Media Expert")).toBeInTheDocument();
      expect(screen.getByText(formatReviewCount(3))).toBeInTheDocument();
      expect(screen.getByText("Allegro")).toBeInTheDocument();
      expect(screen.getByText(formatReviewCount(1))).toBeInTheDocument();
    });

    it("renders empty state message when user has no reviewed shops", () => {
      render(<UserShopStats reviewedShops={[]} />);

      expect(
        screen.getByRole("heading", { name: DASHBOARD_MESSAGES.shopsHeading }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(DASHBOARD_MESSAGES.emptyShopsMessage),
      ).toBeInTheDocument();
    });
  });

  describe("DashboardActions", () => {
    it("renders link to add review and calls signOut upon clicking logout button", async () => {
      const user = userEvent.setup();

      render(<DashboardActions />);

      const addReviewLink = screen.getByRole("link", {
        name: DASHBOARD_MESSAGES.addReviewButton,
      });
      expect(addReviewLink).toHaveAttribute("href", "/opinie/dodaj");

      const logoutButton = screen.getByRole("button", {
        name: DASHBOARD_MESSAGES.signOutButton,
      });
      await user.click(logoutButton);

      expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
    });
  });
});
