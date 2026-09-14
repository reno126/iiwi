import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Register } from "@/app/register/_components/Register";
import { server } from "@/tests/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { signIn } from "next-auth/react";
import {
  saveReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: mockRefresh,
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("app/register/_components/Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders registration form fields and submit button", () => {
    render(<Register />);

    expect(
      screen.getByText("Utwórz konto", { selector: "[data-slot='card-title']" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Imię/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adres e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hasło/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Zarejestruj się" }),
    ).toBeInTheDocument();
  });

  it("validates form fields and displays errors on empty submission", async () => {
    const user = userEvent.setup();
    render(<Register />);

    const submitBtn = screen.getByRole("button", { name: "Zarejestruj się" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Imię musi mieć co najmniej 2 znaki"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Podaj prawidłowy adres e-mail"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Hasło musi mieć co najmniej 6 znaków"),
      ).toBeInTheDocument();
    });
  });

  it("disables submit button and shows loading state during network submission", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/api/register", async () => {
        await delay(150);
        return HttpResponse.json({ success: true }, { status: 201 });
      }),
    );
    vi.mocked(signIn).mockResolvedValueOnce({
      error: null,
      status: 200,
      ok: true,
      url: "/dashboard",
    });

    render(<Register />);

    await user.type(screen.getByLabelText(/Imię/i), "Anna Nowak");
    await user.type(screen.getByLabelText(/Adres e-mail/i), "anna@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "tajnehaslo123");

    const submitBtn = screen.getByRole("button", { name: "Zarejestruj się" });
    await user.click(submitBtn);

    // During in-flight request, button should be disabled and show loading text
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText("Tworzenie konta...")).toBeInTheDocument();

    // After request finishes, auto-login happens and redirects to dashboard
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "anna@example.com",
        password: "tajnehaslo123",
        redirect: false,
      });
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("displays alert with error message when API responds with 409 conflict", async () => {
    const user = userEvent.setup();
    render(<Register />);

    await user.type(screen.getByLabelText(/Imię/i), "Krzysztof Kowal");
    await user.type(screen.getByLabelText(/Adres e-mail/i), "zajety@test.pl");
    await user.type(screen.getByLabelText(/Hasło/i), "bezpiecznehaslo1");

    const submitBtn = screen.getByRole("button", { name: "Zarejestruj się" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Ten adres e-mail jest już zajęty. Zaloguj się na swoje konto.",
        ),
      ).toBeInTheDocument();
    });

    expect(signIn).not.toHaveBeenCalled();
  });

  it("automatically logs in and redirects to custom callbackUrl on successful registration", async () => {
    mockSearchParams = new URLSearchParams("callbackUrl=/opinie/dodaj");
    const user = userEvent.setup();
    vi.mocked(signIn).mockResolvedValueOnce({
      error: null,
      status: 200,
      ok: true,
      url: "/opinie/dodaj",
    });

    render(<Register />);

    await user.type(screen.getByLabelText(/Imię/i), "Piotr Zieliński");
    await user.type(screen.getByLabelText(/Adres e-mail/i), "piotr@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "silnehaslo999");

    const submitBtn = screen.getByRole("button", { name: "Zarejestruj się" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "piotr@example.com",
        password: "silnehaslo999",
        redirect: false,
      });
      expect(mockPush).toHaveBeenCalledWith("/opinie/dodaj");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("redirects to /login if registration succeeds but auto-login fails", async () => {
    const user = userEvent.setup();
    vi.mocked(signIn).mockResolvedValueOnce({
      error: "CredentialsSignin",
      status: 401,
      ok: false,
      url: null,
    });

    render(<Register />);

    await user.type(screen.getByLabelText(/Imię/i), "Jan Testowy");
    await user.type(screen.getByLabelText(/Adres e-mail/i), "jan@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "tajnehaslo123");

    const submitBtn = screen.getByRole("button", { name: "Zarejestruj się" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "jan@example.com",
        password: "tajnehaslo123",
        redirect: false,
      });
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("automatically logs in and redirects to review draft return URL when review draft exists in localStorage", async () => {
    saveReviewDraft({
      type: "NEW_PRODUCT_AND_REVIEW",
      returnUrl: "/opinie/dodaj?source=draft",
      formData: {
        name: "Super Produkt",
        productUrl: "https://shop.pl/produkt",
        description: "Wspaniała opinia",
        rate: 5,
      },
    });

    const user = userEvent.setup();
    vi.mocked(signIn).mockResolvedValueOnce({
      error: null,
      status: 200,
      ok: true,
      url: "/dashboard",
    });

    render(<Register />);

    await user.type(screen.getByLabelText(/Imię/i), "Tomasz Test");
    await user.type(screen.getByLabelText(/Adres e-mail/i), "tomasz@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "bezpieczne123");

    const submitBtn = screen.getByRole("button", { name: "Zarejestruj się" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "tomasz@example.com",
        password: "bezpieczne123",
        redirect: false,
      });
      expect(mockPush).toHaveBeenCalledWith("/opinie/dodaj?source=draft");
      expect(mockRefresh).toHaveBeenCalled();
    });

    clearReviewDraft();
  });

  it("preserves callbackUrl in login link when callbackUrl is in searchParams", () => {
    mockSearchParams = new URLSearchParams("callbackUrl=/opinie/dodaj");
    render(<Register />);

    const loginLink = screen.getByRole("link", { name: "Zaloguj się" });
    expect(loginLink).toHaveAttribute(
      "href",
      "/login?callbackUrl=%2Fopinie%2Fdodaj",
    );
  });
});
