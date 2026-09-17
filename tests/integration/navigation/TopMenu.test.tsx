import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopMenu, TOP_MENU_ITEMS } from "@/components/navigation/TopMenu";
import { NAV_AUTH_MESSAGES } from "@/components/navigation/DesktopNav";
import { USER_ACCOUNT_MESSAGES } from "@/components/navigation/UserAccountMenu";
import { useSession, signOut } from "next-auth/react";

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

    const loginLinks = screen.getAllByRole("link", {
      name: new RegExp(NAV_AUTH_MESSAGES.loginLink, "i"),
    });
    expect(loginLinks.length).toBeGreaterThan(0);
    expect(loginLinks[0]).toHaveAttribute("href", "/login");

    expect(
      screen.getByRole("link", {
        name: new RegExp(NAV_AUTH_MESSAGES.registerLink, "i"),
      }),
    ).toHaveAttribute("href", "/register");

    expect(
      screen.queryByRole("button", {
        name: new RegExp(USER_ACCOUNT_MESSAGES.userMenuAriaLabel, "i"),
      }),
    ).not.toBeInTheDocument();
  });

  it("renders user avatar menu triggers when user is authenticated", () => {
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

    const avatarTriggers = screen.getAllByRole("button", {
      name: new RegExp(USER_ACCOUNT_MESSAGES.userMenuAriaLabel, "i"),
    });
    expect(avatarTriggers.length).toBeGreaterThan(0);

    expect(
      screen.queryByRole("link", {
        name: new RegExp(`^${NAV_AUTH_MESSAGES.loginLink}$`, "i"),
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: new RegExp(`^${NAV_AUTH_MESSAGES.registerLink}$`, "i"),
      }),
    ).not.toBeInTheDocument();
  });

  it("opens user menu and invokes signOut on logout click", async () => {
    const user = userEvent.setup();
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

    const avatarTriggers = screen.getAllByRole("button", {
      name: new RegExp(USER_ACCOUNT_MESSAGES.userMenuAriaLabel, "i"),
    });
    await user.click(avatarTriggers[0]);

    expect(await screen.findByText(userEmail)).toBeInTheDocument();
    expect(screen.getByText("Jan")).toBeInTheDocument();

    const signOutItem = await screen.findByRole("menuitem", {
      name: new RegExp(USER_ACCOUNT_MESSAGES.signOutAction, "i"),
    });
    await user.click(signOutItem);

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
