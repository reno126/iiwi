import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { authOptions, AUTH_ERRORS } from "@/lib/auth/authOptions";

describe("lib/auth/authOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  interface CredentialsProviderOptions {
    authorize?: (
      credentials: Record<string, string> | undefined,
    ) => Promise<{ id: string; email: string; name?: string | null; image?: string | null } | null>;
    options?: {
      authorize?: (
        credentials: Record<string, string> | undefined,
      ) => Promise<{ id: string; email: string; name?: string | null; image?: string | null } | null>;
    };
  }

  const getAuthorizeFn = () => {
    const provider = authOptions.providers.find(
      (p) => p.id === "credentials",
    ) as unknown as CredentialsProviderOptions;

    const authorize = provider?.options?.authorize ?? provider?.authorize;
    if (!authorize) {
      throw new Error("Credentials authorize function not found in authOptions");
    }
    return authorize;
  };

  describe("Credentials authorize", () => {
    it("returns null if user does not exist in database", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const authorize = getAuthorizeFn();
      const result = await authorize({
        email: "unknown@example.com",
        password: "password123",
      });

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "unknown@example.com" },
      });
    });

    it("throws OAuthAccountOnly error if user has no password set (registered via OAuth)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "oauth-user-1",
        email: "google@example.com",
        password: null,
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);

      const authorize = getAuthorizeFn();

      await expect(
        authorize({
          email: "google@example.com",
          password: "password123",
        }),
      ).rejects.toThrow(AUTH_ERRORS.oauthAccountOnly);
    });

    it("returns null if password comparison fails", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-1",
        email: "user@example.com",
        password: "hashedPassword",
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      const authorize = getAuthorizeFn();
      const result = await authorize({
        email: "user@example.com",
        password: "wrongPassword",
      });

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith("wrongPassword", "hashedPassword");
    });

    it("returns user object if password comparison succeeds", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-123",
        email: "user@example.com",
        name: "Jan Kowalski",
        image: "https://example.com/avatar.png",
        password: "hashedPassword",
      } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const authorize = getAuthorizeFn();
      const result = await authorize({
        email: "user@example.com",
        password: "correctPassword",
      });

      expect(result).toEqual({
        id: "user-123",
        email: "user@example.com",
        name: "Jan Kowalski",
        image: "https://example.com/avatar.png",
      });
    });
  });

  describe("callbacks", () => {
    it("jwt callback assigns user id to token.sub", async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      expect(jwtCallback).toBeDefined();

      if (jwtCallback) {
        const token = await jwtCallback({
          token: {},
          user: {
            id: "user-xyz-99",
            email: "test@example.com",
          },
          account: null,
        });

        expect(token.sub).toBe("user-xyz-99");
      }
    });

    it("session callback assigns token.sub to session.user.id", async () => {
      const sessionCallback = authOptions.callbacks?.session;
      expect(sessionCallback).toBeDefined();

      if (sessionCallback) {
        const session = await sessionCallback({
          session: {
            user: { name: "Jan", email: "jan@example.com" },
            expires: "9999-12-31",
          },
          token: { sub: "user-sub-id" },
          user: {
            id: "user-sub-id",
            email: "jan@example.com",
            emailVerified: null,
          },
        } as Parameters<NonNullable<typeof authOptions.callbacks>["session"]>[0]);

        expect(session.user?.id).toBe("user-sub-id");
      }
    });
  });
});
