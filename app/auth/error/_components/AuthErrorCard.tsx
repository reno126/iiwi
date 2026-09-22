"use client";

import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";
import { CircleAlert } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";

export function AuthErrorCard() {
  return (
    <AuthCard
      title="Błąd uwierzytelniania"
      description="Wystąpił problem z dostępem do wybranej strony"
      footer={
        <BackLink href="/" className="w-full justify-center">
          Wróć do strony głównej
        </BackLink>
      }
    >
      <Alert variant="destructive">
        <CircleAlert className="size-4" />
        <AlertDescription>
          Nie masz uprawnień dostępu do tej strony lub Twoja sesja wygasła.
        </AlertDescription>
      </Alert>

      <Button
        type="button"
        className="w-full"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <FaGoogle className="mr-2 text-white" />
        Zaloguj się przez Google
      </Button>
    </AuthCard>
  );
}
