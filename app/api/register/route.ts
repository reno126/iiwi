import { registerSchema, REGISTER_API_MESSAGES } from "@/schemas/register";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { enforceRequestLimits, enforceAccountLimit } from "@/lib/abuse/limits";
import { AbuseLimitError, ABUSE_MESSAGES } from "@/lib/abuse/errors";
import { Prisma } from "@/prisma/generated/client";

export async function POST(request: Request) {
  try {
    await enforceRequestLimits("register", request.headers);
    return await registerUser(request);
  } catch (error) {
    if (error instanceof AbuseLimitError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }
    console.error("[Registration] Request failed", error);
    return NextResponse.json(
      { error: ABUSE_MESSAGES.unavailable },
      { status: 503 },
    );
  }
}

async function registerUser(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return NextResponse.json(
      { error: REGISTER_API_MESSAGES.invalidData },
      { status: 400 },
    );
  }
  const validated = registerSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: REGISTER_API_MESSAGES.invalidData },
      { status: 400 },
    );
  }

  const { email, password, name } = validated.data;
  await enforceAccountLimit("register", email);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (existingUser) {
    if (!existingUser.password && existingUser.accounts.length > 0) {
      const providers = existingUser.accounts
        .map((account) =>
          account.provider === "google" ? "Google" : account.provider,
        )
        .join(", ");
      return NextResponse.json(
        {
          error: REGISTER_API_MESSAGES.oauthAccountLinked(providers),
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: REGISTER_API_MESSAGES.emailTaken },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: REGISTER_API_MESSAGES.emailTaken },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json(
    { success: REGISTER_API_MESSAGES.userCreated },
    { status: 201 },
  );
}
