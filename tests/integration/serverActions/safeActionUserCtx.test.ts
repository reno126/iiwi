import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth helper before importing middleware client
vi.mock("@/lib/auth/helper", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth/helper";
import { safeActionUserCtx } from "@/lib/actions/safeActionUserCtx";

const testAction = safeActionUserCtx.action(async ({ ctx }) => {
  return { receivedUserId: ctx.userId };
});

describe("lib/actions/safeActionUserCtx middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes userId into action context when user session is active", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-alpha-99", email: "user@example.com" },
      expires: "9999-12-31",
    });

    const result = await testAction();
    expect(result?.data).toEqual({ receivedUserId: "user-alpha-99" });
    expect(result?.serverError).toBeUndefined();
  });

  it("returns server error when auth() returns null (unauthenticated)", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const result = await testAction();
    expect(result?.serverError).toBeDefined();
    expect(result?.data).toBeUndefined();
  });

  it("returns server error when session exists but has no user id", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: {},
      expires: "9999-12-31",
    });

    const result = await testAction();
    expect(result?.serverError).toBeDefined();
    expect(result?.data).toBeUndefined();
  });
});
