import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Register } from "@/app/register/_components/Register";
import { server } from "@/tests/mocks/server";
import { http, HttpResponse, delay } from "msw";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

describe("app/register/_components/Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    render(<Register />);

    await user.type(screen.getByLabelText(/Imię/i), "Anna Nowak");
    await user.type(screen.getByLabelText(/Adres e-mail/i), "anna@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "tajnehaslo123");

    const submitBtn = screen.getByRole("button", { name: "Zarejestruj się" });
    await user.click(submitBtn);

    // During in-flight request, button should be disabled and show loading text
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText("Tworzenie konta...")).toBeInTheDocument();

    // After request finishes, success card renders
    await waitFor(() => {
      expect(
        screen.getByText("Rejestracja zakończona sukcesem", {
          selector: "[data-slot='card-title']",
        }),
      ).toBeInTheDocument();
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
  });

  it("renders success card and initiates redirect on 201 response", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<Register />);

    await user.type(screen.getByLabelText(/Imię/i), "Piotr Zieliński");
    await user.type(screen.getByLabelText(/Adres e-mail/i), "piotr@example.com");
    await user.type(screen.getByLabelText(/Hasło/i), "silnehaslo999");

    const submitBtn = screen.getByRole("button", { name: "Zarejestruj się" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Rejestracja zakończona sukcesem", {
          selector: "[data-slot='card-title']",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Możesz się teraz zalogować za pomocą swoich danych/i,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Przejdź do logowania" }),
      ).toBeInTheDocument();
    });

    // Advance 2 seconds for router.push redirect timeout
    vi.advanceTimersByTime(2000);

    expect(mockPush).toHaveBeenCalledWith("/login");

    vi.useRealTimers();
  });
});
