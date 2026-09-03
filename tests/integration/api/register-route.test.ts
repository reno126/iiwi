import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing route
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { POST } from "@/app/api/register/route";

interface MockAccount {
  id: string;
  userId: string;
  provider: string;
  type: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}

interface MockUser {
  id: string;
  name: string | null;
  email: string;
  password: string | null;
  image: string | null;
  emailVerified: Date | null;
  accounts: MockAccount[];
  createdAt: Date;
  updatedAt: Date;
}

describe("app/api/register POST route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when body fails register validation schema", async () => {
    const invalidBody = {
      name: "J", // too short
      email: "not-an-email",
      password: "123", // too short
    };

    const req = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toEqual({ error: "Nieprawidłowe dane" });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 409 with smart hint when user exists via Google OAuth", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "oauth-user-1",
      name: "Google User",
      email: "google@example.com",
      password: null, // OAuth account has no password
      accounts: [
        {
          id: "acc-1",
          userId: "oauth-user-1",
          provider: "google",
          type: "oauth",
          providerAccountId: "google-12345",
          refresh_token: null,
          access_token: null,
          expires_at: null,
          token_type: null,
          scope: null,
          id_token: null,
          session_state: null,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
      emailVerified: null,
    } as unknown as MockUser);

    const req = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Google User",
        email: "google@example.com",
        password: "newPassword123",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.error).toContain("jest połączone z Google. Zaloguj się przez Google.");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 409 when user already exists with credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "existing-user-1",
      name: "Existing User",
      email: "existing@example.com",
      password: "hashedPassword",
      accounts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
      emailVerified: null,
    } as unknown as MockUser);

    const req = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Existing User",
        email: "existing@example.com",
        password: "password123",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.error).toBe(
      "Ten adres e-mail jest już zajęty. Zaloguj się na swoje konto.",
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("hashes password with bcryptjs and creates user on valid request", async () => {
    const hashSpy = vi.spyOn(bcrypt, "hash");

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: "new-user-123",
      name: "Nowy Użytkownik",
      email: "nowy@example.com",
      password: "$2a$12$fakeHashedPasswordString",
      createdAt: new Date(),
      updatedAt: new Date(),
      image: null,
      emailVerified: null,
    } as unknown as MockUser);

    const req = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Nowy Użytkownik",
        email: "nowy@example.com",
        password: "tajneHaslo123",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json).toEqual({ success: "Użytkownik został utworzony" });

    // Verify bcrypt hashing with cost factor 12
    expect(hashSpy).toHaveBeenCalledWith("tajneHaslo123", 12);

    // Verify database record creation
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Nowy Użytkownik",
        email: "nowy@example.com",
        password: expect.any(String),
      },
    });
  });
});
