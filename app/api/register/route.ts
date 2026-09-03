import { RegisterSchema } from "@/schemas/schema";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json();
  const validated = RegisterSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
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
          error: `Konto z tym adresem e-mail już istnieje i jest połączone z ${providers}. Zaloguj się przez ${providers}.`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Ten adres e-mail jest już zajęty. Zaloguj się na swoje konto." },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  return NextResponse.json({ success: "Użytkownik został utworzony" }, { status: 201 });
}
