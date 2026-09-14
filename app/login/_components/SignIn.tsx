"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaGoogle } from "react-icons/fa";
import { CircleAlert } from "lucide-react";

import { loginSchema, type LoginInput } from "@/schemas/login";
import { getReviewDraftReturnUrl } from "@/lib/storage/reviewDraftStorage";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "cn";

interface SignInProps {
  className?: string;
}

export function SignIn({ className }: SignInProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [isGooglePending, startGoogleTransition] = useTransition();

  const registerHref =
    callbackUrl && callbackUrl !== "/dashboard"
      ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/register";

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

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
  const displayedError = errors.root?.message || urlError;

  const onSubmit = async (data: LoginInput) => {
    clearErrors("root");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "OAuthAccountOnly") {
        setError("root", {
          message:
            "To konto zostało utworzone przez Google. Zaloguj się za pomocą przycisku Google poniżej.",
        });
      } else {
        setError("root", {
          message: "Nieprawidłowy adres e-mail lub hasło.",
        });
      }
    } else {
      const targetUrl =
        callbackUrl && callbackUrl !== "/dashboard"
          ? callbackUrl
          : getReviewDraftReturnUrl("/dashboard");
      router.push(targetUrl);
      router.refresh();
    }
  };

  const handleGoogleSignIn = () => {
    const targetUrl =
      callbackUrl && callbackUrl !== "/dashboard"
        ? callbackUrl
        : getReviewDraftReturnUrl("/dashboard");

    startGoogleTransition(async () => {
      await signIn("google", { callbackUrl: targetUrl });
    });
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Adres e-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="twoj@email.com"
                aria-invalid={!!errors.email}
                disabled={isSubmitting || isGooglePending}
                {...register("email")}
              />
              <FieldError
                role={errors.email ? "alert" : undefined}
                aria-hidden={!errors.email}
                className={cn(
                  "min-h-5 text-sm font-normal text-destructive leading-tight",
                  !errors.email && "invisible",
                )}
              >
                {errors.email?.message || "\u00A0"}
              </FieldError>
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Hasło</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                disabled={isSubmitting || isGooglePending}
                {...register("password")}
              />
              <FieldError
                role={errors.password ? "alert" : undefined}
                aria-hidden={!errors.password}
                className={cn(
                  "min-h-5 text-sm font-normal text-destructive leading-tight",
                  !errors.password && "invisible",
                )}
              >
                {errors.password?.message || "\u00A0"}
              </FieldError>
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isGooglePending}
          >
            {isSubmitting && <Spinner className="mr-2" />}
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
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
          disabled={isSubmitting || isGooglePending}
        >
          {isGooglePending ? (
            <Spinner className="mr-2" />
          ) : (
            <FaGoogle className="mr-2 text-red-500" />
          )}
          {isGooglePending ? "Przekierowywanie..." : "Zaloguj się przez Google"}
        </Button>
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4">
        <p className="text-center text-sm text-muted-foreground">
          Nie masz jeszcze konta?{" "}
          <Link
            href={registerHref}
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Zarejestruj się
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default SignIn;
