import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthGatedSubmit } from "@/lib/auth/useAuthGatedSubmit";
import { UNAUTHORIZED_ERROR_MESSAGE } from "@/lib/constants/authErrors";
import {
  getReviewDraft,
  saveReviewDraft,
  type ExistingProductReviewDraft,
} from "@/lib/storage/reviewDraftStorage";
import { REVIEW_ERRORS, type ReviewCreateInput } from "@/schemas/review";

vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));

type ReviewSubmitOptions = Parameters<
  typeof useAuthGatedSubmit<ReviewCreateInput, { id: string }>
>[0];

describe("expired-session submission recovery", () => {
  const returnUrl = "/produkty/product-1?review=add";
  const formData: ReviewCreateInput = {
    productId: "product-1",
    rate: 4,
    description: "Moja niezapisana opinia",
  };
  const draft: ExistingProductReviewDraft = {
    type: "REVIEW_EXISTING_PRODUCT",
    productId: formData.productId,
    returnUrl,
    formData,
  };
  const cachedSession = {
    user: { id: "user-1" },
    expires: "9999-12-31",
  };
  const update = vi.fn<ReturnType<typeof useSession>["update"]>();
  const push = vi.fn();
  const action = vi.fn<ReviewSubmitOptions["action"]>();
  const onSuccess = vi.fn();

  beforeEach(() => {
    update.mockReset();
    push.mockReset();
    action.mockReset();
    onSuccess.mockReset();
    localStorage.clear();
    window.history.replaceState(null, "", returnUrl);
    vi.mocked(useSession).mockReturnValue({
      data: cachedSession,
      status: "authenticated",
      update,
    });
    vi.mocked(useRouter).mockReturnValue({
      push,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      bfcacheId: "test-route",
    });
    action.mockResolvedValueOnce({ serverError: UNAUTHORIZED_ERROR_MESSAGE });
  });

  afterEach(() => {
    localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  function renderSubmission() {
    return renderHook(() => {
      const form = useForm<ReviewCreateInput>({ defaultValues: formData });
      const { handleSubmitAction } = useAuthGatedSubmit<
        ReviewCreateInput,
        { id: string }
      >({
        setError: form.setError,
        clearErrors: form.clearErrors,
        onSaveDraft: (values) =>
          saveReviewDraft({ ...draft, formData: values }),
        action,
        onSuccess,
      });
      return { handleSubmitAction, errors: form.formState.errors };
    });
  }

  it.each(["expired", "refresh failure"])(
    "saves the draft before login navigation when a cached session is %s",
    async (refreshOutcome) => {
      if (refreshOutcome === "expired") update.mockResolvedValueOnce(null);
      else update.mockRejectedValueOnce(new Error("Session unavailable"));
      push.mockImplementation(() => {
        expect(getReviewDraft()).toEqual(draft);
      });
      const { result } = renderSubmission();

      await act(() => result.current.handleSubmitAction(formData));

      expect(update).toHaveBeenCalledOnce();
      expect(action).toHaveBeenCalledOnce();
      expect(getReviewDraft()).toEqual(draft);
      expect(push).toHaveBeenCalledExactlyOnceWith(
        `/login?callbackUrl=${encodeURIComponent(returnUrl)}`,
      );
      expect(onSuccess).not.toHaveBeenCalled();
      expect(result.current.errors).toEqual({});
    },
  );

  it("retries once after a successful refresh and clears the draft on success", async () => {
    saveReviewDraft(draft);
    update.mockResolvedValueOnce(cachedSession);
    action.mockResolvedValueOnce({ data: { id: "review-1" } });
    const { result } = renderSubmission();

    await act(() => result.current.handleSubmitAction(formData));

    expect(update).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledTimes(2);
    expect(action).toHaveBeenNthCalledWith(2, formData);
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith({ id: "review-1" });
    expect(getReviewDraft()).toBeNull();
    expect(push).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({});
  });

  it("shows retry validation errors and retains the draft", async () => {
    const formError = "Review validation failed";
    saveReviewDraft(draft);
    update.mockResolvedValueOnce(cachedSession);
    action.mockResolvedValueOnce({
      validationErrors: {
        fieldErrors: { description: [REVIEW_ERRORS.descriptionMinLength] },
        formErrors: [formError],
      },
    });
    const { result } = renderSubmission();

    await act(() => result.current.handleSubmitAction(formData));

    expect(action).toHaveBeenCalledTimes(2);
    expect(result.current.errors.description?.message).toBe(
      REVIEW_ERRORS.descriptionMinLength,
    );
    expect(result.current.errors.root?.message).toBe(formError);
    expect(getReviewDraft()).toEqual(draft);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("stops after a second unauthorized response without another refresh or retry", async () => {
    saveReviewDraft(draft);
    update.mockResolvedValueOnce(cachedSession);
    action.mockResolvedValueOnce({ serverError: UNAUTHORIZED_ERROR_MESSAGE });
    const { result } = renderSubmission();

    await act(() => result.current.handleSubmitAction(formData));

    expect(update).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledTimes(2);
    expect(result.current.errors.root?.message).toBe(
      UNAUTHORIZED_ERROR_MESSAGE,
    );
    expect(getReviewDraft()).toEqual(draft);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
