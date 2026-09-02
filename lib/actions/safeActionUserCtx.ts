import { createSafeActionClient } from 'next-safe-action';
import { auth } from '@/lib/auth/helper';

export const safeActionUserCtx = createSafeActionClient({
  defaultValidationErrorsShape: "flattened",
}).use(async ({ next }) => {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized user is trying to run in action in user context');
  }

  return next({ ctx: { userId: session.user.id } });
});