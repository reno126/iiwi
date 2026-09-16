import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignIn, SIGN_IN_MESSAGES } from "@/app/login/_components/SignIn";
import { LOGIN_ERRORS } from "@/schemas/login";
import { AUTH_ERRORS, AUTH_ERROR_MESSAGES } from "@/lib/auth/constants";
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

function createSignInDriver() {
  const user = userEvent.setup();
  return {
    user,
    heading: () => screen.getByRole("heading", { name: new RegExp(SIGN_IN_MESSAGES.title, "i") }),
    emailInput: () => screen.getByRole("textbox", { name: new RegExp(SIGN_IN_MESSAGES.emailLabel, "i") }),
    passwordInput: () => screen.getByLabelText(new RegExp(SIGN_IN_MESSAGES.passwordLabel, "i")),
    submitButton: () => screen.getByRole("button", { name: new RegExp(`^${SIGN_IN_MESSAGES.submitButton}$`, "i") }),
    googleButton: () =>
      screen.getByRole("button", { name: new RegExp(SIGN_IN_MESSAGES.googleButton, "i") }),
    registerLink: () => screen.getByRole("link", { name: new RegExp(SIGN_IN_MESSAGES.registerLink, "i") }),
    alert: () => screen.getByRole("alert"),
    async fillForm(data: { email?: string; password?: string }) {
      if (data.email) await user.type(this.emailInput(), data.email);
      if (data.password) await user.type(this.passwordInput(), data.password);
    },
    async submit() {
      await user.click(this.submitButton());
    },
    async clickGoogle() {
      await user.click(this.googleButton());
    },
  };
}

describe("app/login/_components/SignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders the sign-in form correctly", () => {
    render(<SignIn />);
    const driver = createSignInDriver();

    expect(driver.heading()).toBeInTheDocument();
    expect(driver.emailInput()).toBeInTheDocument();
    expect(driver.passwordInput()).toBeInTheDocument();
    expect(driver.submitButton()).toBeInTheDocument();
    expect(driver.googleButton()).toBeInTheDocument();
  });

  it("displays validation errors when submitting empty form", async () => {
    render(<SignIn />);
    const driver = createSignInDriver();

    await driver.submit();

    await waitFor(() => {
      expect(driver.emailInput()).toBeInvalid();
      expect(driver.passwordInput()).toBeInvalid();
      expect(
        screen.getByText(LOGIN_ERRORS.invalidEmail),
      ).toBeInTheDocument();
      expect(
        screen.getByText(LOGIN_ERRORS.passwordRequired),
      ).toBeInTheDocument();
    });

    expect(signIn).not.toHaveBeenCalled();
  });

  it("submits valid credentials and redirects to dashboard", async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      error: null,
      status: 200,
      ok: true,
      url: "/dashboard",
    });

    render(<SignIn />);
    const driver = createSignInDriver();

    await driver.fillForm({
      email: "test@example.com",
      password: "password123",
    });

    await driver.submit();

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
    vi.mocked(signIn).mockResolvedValueOnce({
      error: AUTH_ERRORS.oauthAccountOnly,
      status: 401,
      ok: false,
      url: null,
    });

    render(<SignIn />);
    const driver = createSignInDriver();

    await driver.fillForm({
      email: "google.user@example.com",
      password: "password123",
    });

    await driver.submit();

    await waitFor(() => {
      expect(driver.alert()).toBeInTheDocument();
      expect(
        screen.getByText(AUTH_ERROR_MESSAGES.oauthAccountOnly),
      ).toBeInTheDocument();
    });
  });

  it("displays generic credentials error alert on wrong password", async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      error: AUTH_ERRORS.credentialsSignin,
      status: 401,
      ok: false,
      url: null,
    });

    render(<SignIn />);
    const driver = createSignInDriver();

    await driver.fillForm({
      email: "user@example.com",
      password: "wrongpassword",
    });

    await driver.submit();

    await waitFor(() => {
      expect(driver.alert()).toBeInTheDocument();
      expect(
        screen.getByText(AUTH_ERROR_MESSAGES.credentialsSignin),
      ).toBeInTheDocument();
    });
  });

  it("displays alert when URL search param contains error", () => {
    mockSearchParams = new URLSearchParams(`error=${AUTH_ERRORS.oauthAccountOnly}`);

    render(<SignIn />);
    const driver = createSignInDriver();

    expect(driver.alert()).toBeInTheDocument();
    expect(
      screen.getByText(AUTH_ERROR_MESSAGES.oauthAccountOnly),
    ).toBeInTheDocument();
  });

  it("triggers Google OAuth flow when clicking Google button", async () => {
    render(<SignIn />);
    const driver = createSignInDriver();

    await driver.clickGoogle();

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard",
      });
    });
  });

  it("redirects credentials sign-in to review draft return URL when draft exists in localStorage", async () => {
    saveReviewDraft({
      type: "NEW_PRODUCT_AND_REVIEW",
      returnUrl: "/opinie/dodaj?step=2",
      formData: {
        name: "Test Produkt",
        productUrl: "https://shop.pl/test",
        description: "Super opinia",
        rate: 5,
      },
    });

    vi.mocked(signIn).mockResolvedValueOnce({
      error: null,
      status: 200,
      ok: true,
      url: "/dashboard",
    });

    render(<SignIn />);
    const driver = createSignInDriver();

    await driver.fillForm({
      email: "test@example.com",
      password: "password123",
    });

    await driver.submit();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/opinie/dodaj?step=2");
      expect(mockRefresh).toHaveBeenCalled();
    });

    clearReviewDraft();
  });

  it("triggers Google OAuth flow with review draft return URL when draft exists in localStorage", async () => {
    saveReviewDraft({
      type: "REVIEW_EXISTING_PRODUCT",
      returnUrl: "/produkty/prod-123",
      productId: "prod-123",
      formData: {
        productId: "prod-123",
        description: "Opinia produktu",
        rate: 5,
      },
    });

    render(<SignIn />);
    const driver = createSignInDriver();

    await driver.clickGoogle();

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/produkty/prod-123",
      });
    });

    clearReviewDraft();
  });

  it("preserves callbackUrl in register link when callbackUrl is in searchParams", () => {
    mockSearchParams = new URLSearchParams("callbackUrl=/opinie/dodaj");
    render(<SignIn />);
    const driver = createSignInDriver();

    expect(driver.registerLink()).toHaveAttribute(
      "href",
      "/register?callbackUrl=%2Fopinie%2Fdodaj",
    );
  });
});
