"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

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
      Wyloguj się
    </Button>
  );
}

export default SignOut;
