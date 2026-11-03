import { createSafeActionClient } from "next-safe-action";
import { AbuseLimitError } from "@/lib/abuse/errors";

export const DEFAULT_SERVER_ACTION_ERROR =
  "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.";

export const publicActionClient = createSafeActionClient({
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error) => {
    if (error instanceof AbuseLimitError) return error.message;
    console.error("[publicActionClient Server Error]:", error);
    return DEFAULT_SERVER_ACTION_ERROR;
  },
});
