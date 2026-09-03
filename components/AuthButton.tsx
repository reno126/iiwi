"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          Zalogowano jako: <strong className="text-foreground">{session.user?.email}</strong>
        </span>
        <Button variant="outline" size="sm" onClick={() => signOut()}>
          Wyloguj się
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    >
      <FaGoogle className="mr-2 text-red-500" />
      Zaloguj się przez Google
    </Button>
  );
}

export default AuthButton;
