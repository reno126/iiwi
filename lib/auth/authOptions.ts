import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db/prisma";
import { AUTH_ERRORS } from "@/lib/auth/constants";

export { AUTH_ERRORS };

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

function getAuthSecret(): string {
  const configuredSecret =
    process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!configuredSecret) {
    if (process.env.NODE_ENV === "test") {
      return "test-nextauth-secret-for-testing-only";
    }
    throw new Error("NEXTAUTH_SECRET is required");
  }
  return configuredSecret;
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      credentials: {
        email: { type: "text" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (
          !email ||
          !password ||
          typeof email !== "string" ||
          typeof password !== "string"
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        if (!user.password) {
          throw new Error(AUTH_ERRORS.oauthAccountOnly);
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  secret: getAuthSecret(),
  pages: {
    error: "/auth/error",
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthOptions;
