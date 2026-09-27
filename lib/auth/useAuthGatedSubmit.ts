import { useCallback, useRef } from "react";
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
  const isSubmittingRef = useRef(false);

  const handleSubmitAction = useCallback(
    async (formData: TForm) => {
      if (isSubmittingRef.current) {
        return;
      }
      isSubmittingRef.current = true;

      try {
        clearErrors("root");

        const isAuthenticated = await ensureAuthenticated({
          onUnauthenticated: () => onSaveDraft(formData),
        });

        if (!isAuthenticated) {
          return;
        }

        const actionResult = await action(formData);

        if (actionResult?.serverError === UNAUTHORIZED_ERROR_MESSAGE) {
          const isStillAuthenticated = await ensureAuthenticated({
            onUnauthenticated: () => onSaveDraft(formData),
          });
          if (!isStillAuthenticated) return;

          const retryResult = await action(formData);
          if (retryResult?.data) {
            clearReviewDraft();
            onSuccess(retryResult.data);
            return;
          }
          if (retryResult?.serverError) {
            setError("root", { message: retryResult.serverError });
            return;
          }
        }

        if (actionResult?.serverError) {
          setError("root", { message: actionResult.serverError });
          return;
        }

        if (actionResult?.validationErrors) {
          const { fieldErrors, formErrors } = actionResult.validationErrors;
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

        if (actionResult?.data) {
          clearReviewDraft();
          onSuccess(actionResult.data);
        }
      } finally {
        isSubmittingRef.current = false;
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
