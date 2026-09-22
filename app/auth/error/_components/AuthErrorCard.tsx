"use client";

import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";
import { CircleAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";

export function AuthErrorCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Błąd uwierzytelniania</CardTitle>
        <CardDescription>
          Wystąpił problem z dostępem do wybranej strony
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4">
        <BackLink href="/" className="w-full justify-center">
          Wróć do strony głównej
        </BackLink>
      </CardFooter>
    </Card>
  );
}
