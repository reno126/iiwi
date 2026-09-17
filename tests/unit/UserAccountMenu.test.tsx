import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  UserAccountMenu,
  USER_ACCOUNT_MESSAGES,
} from "@/components/navigation/UserAccountMenu";
import { signOut } from "next-auth/react";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("components/navigation/UserAccountMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders trigger button with correct accessible label and user initials fallback", () => {
    render(
      <UserAccountMenu
        user="jan.kowalski@example.com"
        userName="Jan Kowalski"
      />,
    );

    const trigger = screen.getByRole("button", {
      name: new RegExp(USER_ACCOUNT_MESSAGES.userMenuAriaLabel, "i"),
    });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders fallback initial 'U' when no name or email is supplied", () => {
    render(<UserAccountMenu />);

    const trigger = screen.getByRole("button", {
      name: new RegExp(USER_ACCOUNT_MESSAGES.userMenuAriaLabel, "i"),
    });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("displays user information and navigation links when opened", async () => {
    const user = userEvent.setup();
    const testEmail = "anna.nowak@example.com";
    const testName = "Anna Nowak";

    render(
      <UserAccountMenu
        user={testEmail}
        userName={testName}
        userImage="https://example.com/avatar.png"
      />,
    );

    const trigger = screen.getByRole("button", {
      name: new RegExp(USER_ACCOUNT_MESSAGES.userMenuAriaLabel, "i"),
    });
    await user.click(trigger);

    expect(screen.getByText(testName)).toBeInTheDocument();
    expect(screen.getByText(testEmail)).toBeInTheDocument();

    const dashboardItem = screen.getByRole("menuitem", {
      name: new RegExp(USER_ACCOUNT_MESSAGES.dashboardLink, "i"),
    });
    expect(dashboardItem).toHaveAttribute("href", "/dashboard");

    const addReviewItem = screen.getByRole("menuitem", {
      name: new RegExp(USER_ACCOUNT_MESSAGES.addReviewLink, "i"),
    });
    expect(addReviewItem).toHaveAttribute("href", "/opinie/dodaj");
  });

  it("triggers signOut with callback to /login when clicking sign out", async () => {
    const user = userEvent.setup();

    render(
      <UserAccountMenu
        user="test@example.com"
        userName="Tester"
      />,
    );

    const trigger = screen.getByRole("button", {
      name: new RegExp(USER_ACCOUNT_MESSAGES.userMenuAriaLabel, "i"),
    });
    await user.click(trigger);

    const signOutItem = screen.getByRole("menuitem", {
      name: new RegExp(USER_ACCOUNT_MESSAGES.signOutAction, "i"),
    });
    await user.click(signOutItem);

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
