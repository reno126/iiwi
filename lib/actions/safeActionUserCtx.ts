import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/lib/auth/helper";
import { UNAUTHORIZED_ERROR_MESSAGE } from "@/lib/constants/authErrors";

export const safeActionUserCtx = createSafeActionClient({
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error) => {
    if (
      error.message === UNAUTHORIZED_ERROR_MESSAGE ||
      error.message.includes("Unauthorized")
    ) {
      return UNAUTHORIZED_ERROR_MESSAGE;
    }
    return error.message;
  },
}).use(async ({ next }) => {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error(UNAUTHORIZED_ERROR_MESSAGE);
  }

  return next({ ctx: { userId: session.user.id } });
});
