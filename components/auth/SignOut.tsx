"use client";

import { signOut } from "next-auth/react";

export function SignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Wyloguj się
    </button>
  );
}
