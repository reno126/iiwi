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
import { AuthCard } from "@/components/auth/AuthCard";
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
    <AuthCard
      title="Zaloguj się"
      description="Wprowadź swoje dane, aby uzyskać dostęp do konta"
      className={className}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Nie masz jeszcze konta?{" "}
          <Link
            href={registerHref}
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Zarejestruj się
          </Link>
        </p>
      }
    >
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
              sizeVariant="touch"
              autoComplete="email"
              placeholder="twoj@email.com"
              aria-invalid={!!errors.email}
              disabled={isSubmitting || isGooglePending}
              {...register("email")}
            />
            <FieldError reserveSpace>{errors.email?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Hasło</FieldLabel>
            <Input
              id="password"
              type="password"
              sizeVariant="touch"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              disabled={isSubmitting || isGooglePending}
              {...register("password")}
            />
            <FieldError reserveSpace>{errors.password?.message}</FieldError>
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          size="touch"
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
        size="touch"
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
    </AuthCard>
  );
}

export default SignIn;
