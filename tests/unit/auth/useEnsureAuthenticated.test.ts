import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEnsureAuthenticated } from "@/lib/auth/useEnsureAuthenticated";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("lib/auth/useEnsureAuthenticated", () => {
  const pushMock = vi.fn();
  const updateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("returns true immediately without updating or redirecting if session already exists", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "user-123" }, expires: "9999-12-31" },
      status: "authenticated",
      update: updateMock,
    });

    const { result } = renderHook(() => useEnsureAuthenticated());
    expect(result.current.isAuthenticated).toBe(true);

    const isAuth = await result.current.ensureAuthenticated();
    expect(isAuth).toBe(true);
    expect(updateMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("attempts to refresh session via update() if session is missing; succeeds if update returns user", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: updateMock,
    });
    updateMock.mockResolvedValueOnce({
      user: { id: "user-refreshed-456" },
      expires: "9999-12-31",
    });

    const { result } = renderHook(() => useEnsureAuthenticated());
    expect(result.current.isAuthenticated).toBe(false);

    const onUnauthenticatedMock = vi.fn();
    const isAuth = await result.current.ensureAuthenticated({
      onUnauthenticated: onUnauthenticatedMock,
    });

    expect(isAuth).toBe(true);
    expect(updateMock).toHaveBeenCalled();
    expect(onUnauthenticatedMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("calls onUnauthenticated and redirects to login with callbackUrl when session refresh fails", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: updateMock,
    });
    updateMock.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useEnsureAuthenticated());

    const onUnauthenticatedMock = vi.fn();
    const isAuth = await result.current.ensureAuthenticated({
      onUnauthenticated: onUnauthenticatedMock,
      callbackUrl: "/opinie/dodaj",
    });

    expect(isAuth).toBe(false);
    expect(updateMock).toHaveBeenCalled();
    expect(onUnauthenticatedMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Fopinie%2Fdodaj",
    );
  });
});
