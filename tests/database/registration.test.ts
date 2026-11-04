import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { database, controlPool } from "./helpers/database";

vi.mock("@/lib/abuse/limits", () => ({
  enforceRequestLimits: vi.fn(),
  enforceAccountLimit: vi.fn(),
}));

vi.mock("@/lib/db/prisma", async () => {
  const { database } = await import("./helpers/database");
  const lookupBarrier = Promise.withResolvers<void>();
  let completedLookups = 0;
  return {
    prisma: database.$extends({
      query: {
        user: {
          async findUnique({ args, query }) {
            const existingUser = await query(args);
            completedLookups += 1;
            if (completedLookups === 2) lookupBarrier.resolve();
            await lookupBarrier.promise;
            return existingUser;
          },
        },
      },
    }),
  };
});

import { POST } from "@/app/api/register/route";
import { REGISTER_API_MESSAGES } from "@/schemas/register";

describe("PostgreSQL concurrent registration", () => {
  afterAll(async () => {
    await database.$disconnect();
    await controlPool.end();
  });

  it("creates one account and returns 409 when both requests pass the existence check", async () => {
    const email = `${randomUUID()}@registration-test.invalid`;
    const password = "concurrent-password";
    const requests = [email, ` ${email} `].map(
      (submittedEmail) =>
        new Request("http://localhost/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Concurrent User",
            email: submittedEmail,
            password,
          }),
        }),
    );

    try {
      const responses = await Promise.all(
        requests.map((request) => POST(request)),
      );
      expect(responses.map((response) => response.status).sort()).toEqual([
        201, 409,
      ]);
      const conflict = responses.find((response) => response.status === 409);
      expect(await conflict?.json()).toEqual({
        error: REGISTER_API_MESSAGES.emailTaken,
      });

      const users = await database.user.findMany({ where: { email } });
      expect(users).toHaveLength(1);
      const createdUser = users[0];
      expect(createdUser?.name).toBe("Concurrent User");
      expect(createdUser?.password).not.toBe(password);
      expect(await bcrypt.compare(password, createdUser?.password ?? "")).toBe(
        true,
      );
    } finally {
      await database.user.deleteMany({ where: { email } });
    }
  });
});
