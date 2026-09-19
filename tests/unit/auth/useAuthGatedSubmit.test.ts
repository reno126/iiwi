import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthGatedSubmit } from "@/lib/auth/useAuthGatedSubmit";
import { UNAUTHORIZED_ERROR_MESSAGE } from "@/lib/constants/authErrors";

vi.mock("@/lib/auth/useEnsureAuthenticated", () => ({
  useEnsureAuthenticated: vi.fn(),
}));

vi.mock("@/lib/storage/reviewDraftStorage", () => ({
  clearReviewDraft: vi.fn(),
}));

import { useEnsureAuthenticated } from "@/lib/auth/useEnsureAuthenticated";
import { clearReviewDraft } from "@/lib/storage/reviewDraftStorage";

interface TestFormValues {
  name: string;
  rating: number;
}

describe("lib/auth/useAuthGatedSubmit", () => {
  const setErrorMock = vi.fn();
  const clearErrorsMock = vi.fn();
  const onSaveDraftMock = vi.fn();
  const actionMock = vi.fn();
  const onSuccessMock = vi.fn();
  const ensureAuthenticatedMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEnsureAuthenticated).mockReturnValue({
      ensureAuthenticated: ensureAuthenticatedMock,
      isAuthenticated: false,
    });
  });

  const setupHook = () =>
    renderHook(() =>
      useAuthGatedSubmit<TestFormValues, { id: string }>({
        setError: setErrorMock,
        clearErrors: clearErrorsMock,
        onSaveDraft: onSaveDraftMock,
        action: actionMock,
        onSuccess: onSuccessMock,
      }),
    );

  it("calls onSaveDraft and blocks action execution when user is unauthenticated", async () => {
    ensureAuthenticatedMock.mockImplementationOnce(
      async ({ onUnauthenticated }) => {
        onUnauthenticated();
        return false;
      },
    );

    const { result } = setupHook();
    const testData: TestFormValues = { name: "Test", rating: 5 };

    await act(async () => {
      await result.current.handleSubmitAction(testData);
    });

    expect(clearErrorsMock).toHaveBeenCalledWith("root");
    expect(onSaveDraftMock).toHaveBeenCalledWith(testData);
    expect(actionMock).not.toHaveBeenCalled();
    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(clearReviewDraft).not.toHaveBeenCalled();
  });

  it("executes action, clears review draft, and calls onSuccess on successful submission", async () => {
    ensureAuthenticatedMock.mockResolvedValueOnce(true);
    actionMock.mockResolvedValueOnce({ data: { id: "item-1" } });

    const { result } = setupHook();
    const testData: TestFormValues = { name: "Test Product", rating: 4 };

    await act(async () => {
      await result.current.handleSubmitAction(testData);
    });

    expect(clearErrorsMock).toHaveBeenCalledWith("root");
    expect(actionMock).toHaveBeenCalledWith(testData);
    expect(clearReviewDraft).toHaveBeenCalledTimes(1);
    expect(onSuccessMock).toHaveBeenCalledWith({ id: "item-1" });
    expect(setErrorMock).not.toHaveBeenCalled();
  });

  it("sets root error when action returns a generic serverError", async () => {
    ensureAuthenticatedMock.mockResolvedValueOnce(true);
    actionMock.mockResolvedValueOnce({
      serverError: "Błąd serwera podczas zapisu",
    });

    const { result } = setupHook();

    await act(async () => {
      await result.current.handleSubmitAction({
        name: "Error Item",
        rating: 1,
      });
    });

    expect(setErrorMock).toHaveBeenCalledWith("root", {
      message: "Błąd serwera podczas zapisu",
    });
    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(clearReviewDraft).not.toHaveBeenCalled();
  });

  it("maps fieldErrors and formErrors to form errors when validation fails", async () => {
    ensureAuthenticatedMock.mockResolvedValueOnce(true);
    actionMock.mockResolvedValueOnce({
      validationErrors: {
        fieldErrors: {
          name: ["Nazwa jest za krótka"],
          rating: ["Ocena jest wymagana"],
        },
        formErrors: ["Błąd walidacji całego formularza"],
      },
    });

    const { result } = setupHook();

    await act(async () => {
      await result.current.handleSubmitAction({ name: "A", rating: 0 });
    });

    expect(setErrorMock).toHaveBeenCalledWith("name", {
      message: "Nazwa jest za krótka",
    });
    expect(setErrorMock).toHaveBeenCalledWith("rating", {
      message: "Ocena jest wymagana",
    });
    expect(setErrorMock).toHaveBeenCalledWith("root", {
      message: "Błąd walidacji całego formularza",
    });
    expect(onSuccessMock).not.toHaveBeenCalled();
  });

  it("handles 401 unauthorized: re-verifies session, retries action, and succeeds", async () => {
    ensureAuthenticatedMock.mockResolvedValueOnce(true);
    actionMock.mockResolvedValueOnce({
      serverError: UNAUTHORIZED_ERROR_MESSAGE,
    });

    ensureAuthenticatedMock.mockResolvedValueOnce(true);
    actionMock.mockResolvedValueOnce({ data: { id: "item-retried" } });

    const { result } = setupHook();
    const testData: TestFormValues = { name: "Retry Product", rating: 5 };

    await act(async () => {
      await result.current.handleSubmitAction(testData);
    });

    expect(actionMock).toHaveBeenCalledTimes(2);
    expect(clearReviewDraft).toHaveBeenCalledTimes(1);
    expect(onSuccessMock).toHaveBeenCalledWith({ id: "item-retried" });
  });

  it("handles 401 unauthorized: saves draft and aborts if session refresh fails", async () => {
    ensureAuthenticatedMock.mockResolvedValueOnce(true);
    actionMock.mockResolvedValueOnce({
      serverError: UNAUTHORIZED_ERROR_MESSAGE,
    });

    ensureAuthenticatedMock.mockImplementationOnce(
      async ({ onUnauthenticated }) => {
        onUnauthenticated();
        return false;
      },
    );

    const { result } = setupHook();
    const testData: TestFormValues = { name: "Aborted Retry", rating: 3 };

    await act(async () => {
      await result.current.handleSubmitAction(testData);
    });

    expect(actionMock).toHaveBeenCalledTimes(1);
    expect(onSaveDraftMock).toHaveBeenCalledWith(testData);
    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(clearReviewDraft).not.toHaveBeenCalled();
  });

  it("handles 401 unauthorized: sets root error when retried action fails with server error", async () => {
    ensureAuthenticatedMock.mockResolvedValueOnce(true);
    actionMock.mockResolvedValueOnce({
      serverError: UNAUTHORIZED_ERROR_MESSAGE,
    });

    ensureAuthenticatedMock.mockResolvedValueOnce(true);
    actionMock.mockResolvedValueOnce({ serverError: "Ponowny błąd serwera" });

    const { result } = setupHook();
    const testData: TestFormValues = { name: "Failing Retry", rating: 2 };

    await act(async () => {
      await result.current.handleSubmitAction(testData);
    });

    expect(actionMock).toHaveBeenCalledTimes(2);
    expect(setErrorMock).toHaveBeenCalledWith("root", {
      message: "Ponowny błąd serwera",
    });
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});
