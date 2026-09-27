import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/lib/auth/helper";
import { UNAUTHORIZED_ERROR_MESSAGE } from "@/lib/constants/authErrors";
import { DEFAULT_SERVER_ACTION_ERROR } from "@/lib/actions/safeActionClient";

export class ActionUnauthorizedError extends Error {
  constructor(message = UNAUTHORIZED_ERROR_MESSAGE) {
    super(message);
    this.name = "ActionUnauthorizedError";
  }
}

export const safeActionUserCtx = createSafeActionClient({
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error) => {
    if (
      error instanceof ActionUnauthorizedError ||
      error.message === UNAUTHORIZED_ERROR_MESSAGE
    ) {
      return UNAUTHORIZED_ERROR_MESSAGE;
    }
    console.error("[safeActionUserCtx Server Error]:", error);
    return DEFAULT_SERVER_ACTION_ERROR;
  },
}).use(async ({ next }) => {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ActionUnauthorizedError();
  }

  return next({ ctx: { userId: session.user.id } });
});
