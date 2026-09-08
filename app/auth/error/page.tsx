"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function AuthErrorPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
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
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full text-muted-foreground")}
          >
            Wróć do strony głównej
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default AuthErrorPage;