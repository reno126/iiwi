import { createSafeActionClient } from "next-safe-action";

export const publicActionClient = createSafeActionClient({
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error) => error.message,
});
