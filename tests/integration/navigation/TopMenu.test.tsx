import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopMenu, TOP_MENU_ITEMS } from "@/components/navigation/TopMenu";
import { NAV_AUTH_MESSAGES } from "@/components/navigation/DesktopNav";
import { SIGN_OUT_MESSAGES } from "@/components/auth/SignOut";
import { useSession } from "next-auth/react";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

describe("components/navigation/TopMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders common navigation links regardless of auth state", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<TopMenu />);

    TOP_MENU_ITEMS.forEach((item) => {
      expect(
        screen.getByRole("link", { name: new RegExp(`^${item.title}$`, "i") }),
      ).toHaveAttribute("href", item.href);
    });
  });

  it("renders login and register links when user is unauthenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<TopMenu />);

    expect(
      screen.getByRole("link", { name: new RegExp(NAV_AUTH_MESSAGES.loginLink, "i") }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("link", { name: new RegExp(NAV_AUTH_MESSAGES.registerLink, "i") }),
    ).toHaveAttribute("href", "/register");
    expect(screen.queryByText(new RegExp(NAV_AUTH_MESSAGES.loggedInAs, "i"))).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: new RegExp(SIGN_OUT_MESSAGES.button, "i") }),
    ).not.toBeInTheDocument();
  });

  it("renders user email and SignOut button when user is authenticated", () => {
    const userEmail = "jan.kowalski@example.com";
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { email: userEmail, name: "Jan" },
        expires: "9999-12-31",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<TopMenu />);

    expect(screen.getByText(new RegExp(NAV_AUTH_MESSAGES.loggedInAs, "i"))).toBeInTheDocument();
    expect(screen.getByText(userEmail)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(SIGN_OUT_MESSAGES.button, "i") }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: new RegExp(NAV_AUTH_MESSAGES.loginLink, "i") }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: new RegExp(NAV_AUTH_MESSAGES.registerLink, "i") }),
    ).not.toBeInTheDocument();
  });
});
