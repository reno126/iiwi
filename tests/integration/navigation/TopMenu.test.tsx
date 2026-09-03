import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopMenu } from "@/components/navigation/TopMenu";
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

    expect(screen.getByRole("link", { name: "Strona główna" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Panel" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "Nowy produkt" })).toHaveAttribute(
      "href",
      "/products/new",
    );
  });

  it("renders login and register links when user is unauthenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<TopMenu />);

    expect(screen.getByRole("link", { name: "Zaloguj się" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Zarejestruj się" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.queryByText(/zalogowano jako:/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Wyloguj się" }),
    ).not.toBeInTheDocument();
  });

  it("renders user email and SignOut button when user is authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { email: "jan.kowalski@example.com", name: "Jan" },
        expires: "9999-12-31",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<TopMenu />);

    expect(screen.getByText(/zalogowano jako:/i)).toBeInTheDocument();
    expect(screen.getByText("jan.kowalski@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Wyloguj się" }),
    ).toBeInTheDocument();

    // Login and register links should be hidden when authenticated
    expect(
      screen.queryByRole("link", { name: "Zaloguj się" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Zarejestruj się" }),
    ).not.toBeInTheDocument();
  });
});
