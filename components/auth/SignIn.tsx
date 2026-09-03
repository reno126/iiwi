"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
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
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/shadcn/utils";

interface SignInProps {
  className?: string;
}

export function SignIn({ className }: SignInProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "OAuthAccountNotLinked":
        return "To konto e-mail zostało wcześniej zarejestrowane za pomocą hasła. Zaloguj się hasłem.";
      case "OAuthAccountOnly":
        return "To konto zostało utworzone przez Google. Zaloguj się za pomocą przycisku Google poniżej.";
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
        return "Wystąpił problem podczas logowania przez Google. Spróbuj ponownie.";
      case "CredentialsSignin":
        return "Nieprawidłowy adres e-mail lub hasło.";
      case "SessionRequired":
        return "Zaloguj się, aby uzyskać dostęp do tej strony.";
      default:
        return errorCode ? "Wystąpił błąd podczas logowania. Spróbuj ponownie." : "";
    }
  };

  const urlError = getErrorMessage(searchParams.get("error"));
  const displayedError = error || urlError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "OAuthAccountOnly") {
          setError(
            "To konto zostało utworzone przez Google. Zaloguj się za pomocą przycisku Google poniżej.",
          );
        } else {
          setError("Nieprawidłowy adres e-mail lub hasło.");
        }
      } else {
        router.push(callbackUrl);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl });
  };

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Zaloguj się</CardTitle>
        <CardDescription>
          Wprowadź swoje dane, aby uzyskać dostęp do konta
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayedError && (
          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertDescription>{displayedError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Adres e-mail</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Hasło</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading && <Spinner className="mr-2" />}
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>

        <div className="relative my-4 flex items-center justify-center">
          <Separator className="w-full" />
          <span className="absolute bg-card px-2 text-xs text-muted-foreground uppercase">
            Lub kontynuuj przez
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Spinner className="mr-2" />
          ) : (
            <FaGoogle className="mr-2 text-red-500" />
          )}
          {isGoogleLoading ? "Przekierowywanie..." : "Zaloguj się przez Google"}
        </Button>
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4">
        <p className="text-center text-sm text-muted-foreground">
          Nie masz jeszcze konta?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Zarejestruj się
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
