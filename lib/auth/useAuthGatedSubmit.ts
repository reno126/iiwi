import { useCallback } from "react";
import {
  type UseFormSetError,
  type UseFormClearErrors,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { UNAUTHORIZED_ERROR_MESSAGE } from "@/lib/constants/authErrors";
import { useEnsureAuthenticated } from "@/lib/auth/useEnsureAuthenticated";
import { clearReviewDraft } from "@/lib/storage/reviewDraftStorage";

interface ActionResult<TData, TFieldErrors> {
  data?: TData;
  serverError?: string;
  validationErrors?: {
    fieldErrors?: TFieldErrors;
    formErrors?: string[];
  };
}

interface UseAuthGatedSubmitOptions<TForm extends FieldValues, TData> {
  setError: UseFormSetError<TForm>;
  clearErrors: UseFormClearErrors<TForm>;
  onSaveDraft: (data: TForm) => void;
  action: (
    data: TForm,
  ) => Promise<
    ActionResult<TData, Record<string, string[] | undefined>> | undefined
  >;
  onSuccess: (data: TData) => void;
}

export function useAuthGatedSubmit<TForm extends FieldValues, TData>({
  setError,
  clearErrors,
  onSaveDraft,
  action,
  onSuccess,
}: UseAuthGatedSubmitOptions<TForm, TData>) {
  const { ensureAuthenticated } = useEnsureAuthenticated();

  const handleSubmitAction = useCallback(
    async (data: TForm) => {
      clearErrors("root");

      const isAuthenticated = await ensureAuthenticated({
        onUnauthenticated: () => onSaveDraft(data),
      });

      if (!isAuthenticated) {
        return;
      }

      const res = await action(data);

      if (res?.serverError === UNAUTHORIZED_ERROR_MESSAGE) {
        const isStillAuth = await ensureAuthenticated({
          onUnauthenticated: () => onSaveDraft(data),
        });
        if (!isStillAuth) return;

        const retryRes = await action(data);
        if (retryRes?.data) {
          clearReviewDraft();
          onSuccess(retryRes.data);
          return;
        }
        if (retryRes?.serverError) {
          setError("root", { message: retryRes.serverError });
          return;
        }
      }

      if (res?.serverError) {
        setError("root", { message: res.serverError });
        return;
      }

      if (res?.validationErrors) {
        const { fieldErrors, formErrors } = res.validationErrors;
        if (fieldErrors) {
          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (messages?.[0]) {
              setError(field as Path<TForm>, {
                message: messages[0],
              });
            }
          }
        }
        if (formErrors?.[0]) {
          setError("root", { message: formErrors[0] });
        }
        return;
      }

      if (res?.data) {
        clearReviewDraft();
        onSuccess(res.data);
      }
    },
    [
      action,
      clearErrors,
      ensureAuthenticated,
      onSaveDraft,
      onSuccess,
      setError,
    ],
  );

  return {
    handleSubmitAction,
  };
}
