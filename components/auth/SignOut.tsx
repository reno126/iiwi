"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export const SIGN_OUT_MESSAGES = {
  button: "Wyloguj się",
} as const;

interface SignOutProps {
  className?: string;
}

export function SignOut({ className }: SignOutProps) {
  return (
    <Button
      variant="destructive"
      size="sm"
      className={className}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      {SIGN_OUT_MESSAGES.button}
    </Button>
  );
}

export default SignOut;
