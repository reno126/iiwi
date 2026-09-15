import { BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/db/prisma";

export const E2E_TEST_PREFIX = "__test__";

export interface TestUser {
  id: string;
  name: string | null;
  email: string;
}

export async function createAuthenticatedSession(
  context: BrowserContext,
  customEmail?: string,
): Promise<TestUser> {
  const email =
    customEmail ||
    `${E2E_TEST_PREFIX}authed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
  const name = `${E2E_TEST_PREFIX} Authed User`;

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: "hashedPasswordPlaceholder",
    },
  });

  const secret =
    process.env.NEXTAUTH_SECRET ||
    "a3f5c7d9e3b4f8a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7";

  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
    },
    secret,
  });

  await context.addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export async function deleteTestUser(userId: string): Promise<void> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch {
  }
}

export async function cleanAllTestRecords(): Promise<{
  deletedProducts: number;
  deletedUsers: number;
}> {
  const deletedProducts = await prisma.product.deleteMany({
    where: {
      OR: [
        { name: { startsWith: E2E_TEST_PREFIX } },
        { code: { startsWith: E2E_TEST_PREFIX } },
      ],
    },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: E2E_TEST_PREFIX } },
        { name: { startsWith: E2E_TEST_PREFIX } },
      ],
    },
  });

  return {
    deletedProducts: deletedProducts.count,
    deletedUsers: deletedUsers.count,
  };
}
