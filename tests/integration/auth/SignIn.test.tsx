import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignIn } from "@/app/login/_components/SignIn";
import { signIn } from "next-auth/react";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("app/login/_components/SignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders the sign-in form correctly", () => {
    render(<SignIn />);

    expect(
      screen.getByText("Zaloguj się", { selector: "[data-slot='card-title']" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Adres e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hasło/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Zaloguj się" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Zaloguj się przez Google" }),
    ).toBeInTheDocument();
  });

  it("displays validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    const submitBtn = screen.getByRole("button", { name: "Zaloguj się" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Podaj prawidłowy adres e-mail"),
      ).toBeInTheDocument();
      expect(screen.getByText("Wprowadź hasło")).toBeInTheDocument();
    });

    expect(signIn).not.toHaveBeenCalled();
  });

  it("submits valid credentials and redirects to dashboard", async () => {
    const user = userEvent.setup();
    vi.mocked(signIn).mockResolvedValueOnce({
      error: null,
      status: 200,
      ok: true,
      url: "/dashboard",
    });

    render(<SignIn />);

    await user.type(
      screen.getByLabelText(/Adres e-mail/i),
      "test@example.com",
    );
    await user.type(screen.getByLabelText(/Hasło/i), "password123");

    const submitBtn = screen.getByRole("button", { name: "Zaloguj się" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays dedicated alert when account was registered via Google (OAuthAccountOnly)", async () => {
    const user = userEvent.setup();
    vi.mocked(signIn).mockResolvedValueOnce({
      error: "OAuthAccountOnly",
      status: 401,
      ok: false,
      url: null,
    });

    render(<SignIn />);

    await user.type(
      screen.getByLabelText(/Adres e-mail/i),
      "google.user@example.com",
    );
    await user.type(screen.getByLabelText(/Hasło/i), "password123");

    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "To konto zostało utworzone przez Google. Zaloguj się za pomocą przycisku Google poniżej.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("displays generic credentials error alert on wrong password", async () => {
    const user = userEvent.setup();
    vi.mocked(signIn).mockResolvedValueOnce({
      error: "CredentialsSignin",
      status: 401,
      ok: false,
      url: null,
    });

    render(<SignIn />);

    await user.type(
      screen.getByLabelText(/Adres e-mail/i),
      "user@example.com",
    );
    await user.type(screen.getByLabelText(/Hasło/i), "wrongpassword");

    await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

    await waitFor(() => {
      expect(
        screen.getByText("Nieprawidłowy adres e-mail lub hasło."),
      ).toBeInTheDocument();
    });
  });

  it("displays alert when URL search param contains error", () => {
    mockSearchParams = new URLSearchParams("error=OAuthAccountOnly");

    render(<SignIn />);

    expect(
      screen.getByText(
        "To konto zostało utworzone przez Google. Zaloguj się za pomocą przycisku Google poniżej.",
      ),
    ).toBeInTheDocument();
  });

  it("triggers Google OAuth flow when clicking Google button", async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    const googleBtn = screen.getByRole("button", {
      name: "Zaloguj się przez Google",
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard",
      });
    });
  });
});
