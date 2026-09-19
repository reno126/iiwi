import { registerSchema, REGISTER_API_MESSAGES } from "@/schemas/register";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json();
  const validated = registerSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: REGISTER_API_MESSAGES.invalidData },
      { status: 400 },
    );
  }

  const { email, password, name } = validated.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (existingUser) {
    if (!existingUser.password && existingUser.accounts.length > 0) {
      const providers = existingUser.accounts
        .map((a) => (a.provider === "google" ? "Google" : a.provider))
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

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  return NextResponse.json(
    { success: REGISTER_API_MESSAGES.userCreated },
    { status: 201 },
  );
}
