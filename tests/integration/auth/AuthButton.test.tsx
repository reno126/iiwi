import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthButton } from "@/components/AuthButton";
import { SignOut } from "@/components/auth/SignOut";
import { signIn, signOut, useSession } from "next-auth/react";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

describe("components/AuthButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Google login button when user is unauthenticated", async () => {
    const user = userEvent.setup();
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<AuthButton />);

    const loginBtn = screen.getByRole("button", {
      name: "Zaloguj się przez Google",
    });
    expect(loginBtn).toBeInTheDocument();

    await user.click(loginBtn);
    expect(signIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/dashboard",
    });
  });

  it("renders user email and logout button when user is authenticated", async () => {
    const user = userEvent.setup();
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { email: "zalogowany@example.com", name: "Jan Kowalski" },
        expires: "9999-12-31",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthButton />);

    expect(screen.getByText("Zalogowano jako:")).toBeInTheDocument();
    expect(screen.getByText("zalogowany@example.com")).toBeInTheDocument();

    const logoutBtn = screen.getByRole("button", { name: "Wyloguj się" });
    expect(logoutBtn).toBeInTheDocument();

    await user.click(logoutBtn);
    expect(signOut).toHaveBeenCalled();
  });
});

describe("components/auth/SignOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls signOut with /login callbackUrl on click", async () => {
    const user = userEvent.setup();
    render(<SignOut />);

    const logoutBtn = screen.getByRole("button", { name: "Wyloguj się" });
    await user.click(logoutBtn);

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
