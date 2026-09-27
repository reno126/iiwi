import { createSafeActionClient } from "next-safe-action";

export const DEFAULT_SERVER_ACTION_ERROR =
  "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.";

export const publicActionClient = createSafeActionClient({
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error) => {
    console.error("[publicActionClient Server Error]:", error);
    return DEFAULT_SERVER_ACTION_ERROR;
  },
});
