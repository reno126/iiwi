import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignOut } from "@/components/auth/SignOut";
import { signOut } from "next-auth/react";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

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

  it("passes custom className to the button", () => {
    render(<SignOut className="custom-test-class" />);

    const logoutBtn = screen.getByRole("button", { name: "Wyloguj się" });
    expect(logoutBtn).toHaveClass("custom-test-class");
  });
});
