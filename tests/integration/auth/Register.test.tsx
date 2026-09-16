import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Register, REGISTER_MESSAGES } from "@/app/register/_components/Register";
import { REGISTER_ERRORS, REGISTER_API_MESSAGES } from "@/schemas/register";
import { AUTH_ERRORS } from "@/lib/auth/constants";
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

function createRegisterDriver() {
  const user = userEvent.setup();
  return {
    user,
    heading: () => screen.getByRole("heading", { name: new RegExp(REGISTER_MESSAGES.title, "i") }),
    nameInput: () => screen.getByRole("textbox", { name: new RegExp(REGISTER_MESSAGES.nameLabel, "i") }),
    emailInput: () => screen.getByRole("textbox", { name: new RegExp(REGISTER_MESSAGES.emailLabel, "i") }),
    passwordInput: () => screen.getByLabelText(new RegExp(REGISTER_MESSAGES.passwordLabel, "i")),
    submitButton: () => screen.getByRole("button", { name: new RegExp(`^${REGISTER_MESSAGES.submitButton}$`, "i") }),
    submittingButton: () => screen.getByRole("button", { name: new RegExp(REGISTER_MESSAGES.submittingButton, "i") }),
    loginLink: () => screen.getByRole("link", { name: new RegExp(REGISTER_MESSAGES.loginLink, "i") }),
    alerts: () => screen.getAllByRole("alert"),
    async fillForm(data: { name?: string; email?: string; password?: string }) {
      if (data.name) await user.type(this.nameInput(), data.name);
      if (data.email) await user.type(this.emailInput(), data.email);
      if (data.password) await user.type(this.passwordInput(), data.password);
    },
    async submit() {
      await user.click(this.submitButton());
    },
  };
}

describe("app/register/_components/Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders registration form fields and submit button", () => {
    render(<Register />);
    const driver = createRegisterDriver();

    expect(driver.heading()).toBeInTheDocument();
    expect(driver.nameInput()).toBeInTheDocument();
    expect(driver.emailInput()).toBeInTheDocument();
    expect(driver.passwordInput()).toBeInTheDocument();
    expect(driver.submitButton()).toBeInTheDocument();
  });

  it("validates form fields and displays errors on empty submission", async () => {
    render(<Register />);
    const driver = createRegisterDriver();

    await driver.submit();

    await waitFor(() => {
      expect(driver.nameInput()).toBeInvalid();
      expect(driver.emailInput()).toBeInvalid();
      expect(driver.passwordInput()).toBeInvalid();
      expect(
        screen.getByText(REGISTER_ERRORS.nameMinLength),
      ).toBeInTheDocument();
      expect(
        screen.getByText(REGISTER_ERRORS.invalidEmail),
      ).toBeInTheDocument();
      expect(
        screen.getByText(REGISTER_ERRORS.passwordMinLength),
      ).toBeInTheDocument();
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("disables submit button and shows loading state during network submission", async () => {
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
    const driver = createRegisterDriver();

    await driver.fillForm({
      name: "Anna Nowak",
      email: "anna@example.com",
      password: "tajnehaslo123",
    });

    await driver.submit();

    expect(driver.submittingButton()).toBeDisabled();

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
    render(<Register />);
    const driver = createRegisterDriver();

    await driver.fillForm({
      name: "Krzysztof Kowal",
      email: "zajety@test.pl",
      password: "bezpiecznehaslo1",
    });

    await driver.submit();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText(REGISTER_API_MESSAGES.emailTaken),
      ).toBeInTheDocument();
    });

    expect(signIn).not.toHaveBeenCalled();
  });

  it("automatically logs in and redirects to custom callbackUrl on successful registration", async () => {
    mockSearchParams = new URLSearchParams("callbackUrl=/opinie/dodaj");
    vi.mocked(signIn).mockResolvedValueOnce({
      error: null,
      status: 200,
      ok: true,
      url: "/opinie/dodaj",
    });

    render(<Register />);
    const driver = createRegisterDriver();

    await driver.fillForm({
      name: "Piotr Zieliński",
      email: "piotr@example.com",
      password: "silnehaslo999",
    });

    await driver.submit();

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
    vi.mocked(signIn).mockResolvedValueOnce({
      error: AUTH_ERRORS.credentialsSignin,
      status: 401,
      ok: false,
      url: null,
    });

    render(<Register />);
    const driver = createRegisterDriver();

    await driver.fillForm({
      name: "Jan Testowy",
      email: "jan@example.com",
      password: "tajnehaslo123",
    });

    await driver.submit();

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

    vi.mocked(signIn).mockResolvedValueOnce({
      error: null,
      status: 200,
      ok: true,
      url: "/dashboard",
    });

    render(<Register />);
    const driver = createRegisterDriver();

    await driver.fillForm({
      name: "Tomasz Test",
      email: "tomasz@example.com",
      password: "bezpieczne123",
    });

    await driver.submit();

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
    const driver = createRegisterDriver();

    expect(driver.loginLink()).toHaveAttribute(
      "href",
      "/login?callbackUrl=%2Fopinie%2Fdodaj",
    );
  });
});
