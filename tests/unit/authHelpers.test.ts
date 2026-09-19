import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthErrorMessage } from "@/lib/auth/getAuthErrorMessage";
import { resolveAuthRedirectUrl } from "@/lib/auth/resolveAuthRedirectUrl";
import { AUTH_ERRORS, AUTH_ERROR_MESSAGES } from "@/lib/auth/constants";
import * as reviewDraftStorage from "@/lib/storage/reviewDraftStorage";

describe("lib/auth/getAuthErrorMessage", () => {
  it("returns empty string when errorCode is null or undefined", () => {
    expect(getAuthErrorMessage(null)).toBe("");
  });

  it("maps known OAuth error codes to their translated messages", () => {
    expect(getAuthErrorMessage(AUTH_ERRORS.oauthAccountNotLinked)).toBe(
      AUTH_ERROR_MESSAGES.oauthAccountNotLinked,
    );
    expect(getAuthErrorMessage(AUTH_ERRORS.oauthAccountOnly)).toBe(
      AUTH_ERROR_MESSAGES.oauthAccountOnly,
    );
    expect(getAuthErrorMessage(AUTH_ERRORS.oauthSignin)).toBe(
      AUTH_ERROR_MESSAGES.oauthGeneralError,
    );
  });

  it("maps credentials and session error codes", () => {
    expect(getAuthErrorMessage(AUTH_ERRORS.credentialsSignin)).toBe(
      AUTH_ERROR_MESSAGES.credentialsSignin,
    );
    expect(getAuthErrorMessage(AUTH_ERRORS.sessionRequired)).toBe(
      AUTH_ERROR_MESSAGES.sessionRequired,
    );
  });

  it("falls back to defaultError for unknown error codes", () => {
    expect(getAuthErrorMessage("UnknownErrorCode")).toBe(
      AUTH_ERROR_MESSAGES.defaultError,
    );
  });
});

describe("lib/auth/resolveAuthRedirectUrl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns custom callbackUrl when valid and not dashboard", () => {
    expect(resolveAuthRedirectUrl("/produkty/prod-123")).toBe(
      "/produkty/prod-123",
    );
  });

  it("falls back to review draft return url when callbackUrl is missing or /dashboard", () => {
    vi.spyOn(reviewDraftStorage, "getReviewDraftReturnUrl").mockReturnValue(
      "/opinie/dodaj",
    );

    expect(resolveAuthRedirectUrl(null)).toBe("/opinie/dodaj");
    expect(resolveAuthRedirectUrl("/dashboard")).toBe("/opinie/dodaj");
  });
});
