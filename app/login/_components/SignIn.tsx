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
import { AUTH_ERRORS, AUTH_ERROR_MESSAGES } from "@/lib/auth/constants";
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

export const SIGN_IN_MESSAGES = {
  title: "Zaloguj się",
  description: "Wprowadź swoje dane, aby uzyskać dostęp do konta",
  footerPrompt: "Nie masz jeszcze konta?",
  registerLink: "Zarejestruj się",
  emailLabel: "Adres e-mail",
  emailPlaceholder: "twoj@email.com",
  passwordLabel: "Hasło",
  passwordPlaceholder: "••••••••",
  submitButton: "Zaloguj się",
  submittingButton: "Logowanie...",
  orContinueWith: "Lub kontynuuj przez",
  googleButton: "Zaloguj się przez Google",
  googlePending: "Przekierowywanie...",
} as const;

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
      case AUTH_ERRORS.oauthAccountNotLinked:
        return AUTH_ERROR_MESSAGES.oauthAccountNotLinked;
      case AUTH_ERRORS.oauthAccountOnly:
        return AUTH_ERROR_MESSAGES.oauthAccountOnly;
      case AUTH_ERRORS.oauthSignin:
      case AUTH_ERRORS.oauthCallback:
      case AUTH_ERRORS.oauthCreateAccount:
        return AUTH_ERROR_MESSAGES.oauthGeneralError;
      case AUTH_ERRORS.credentialsSignin:
        return AUTH_ERROR_MESSAGES.credentialsSignin;
      case AUTH_ERRORS.sessionRequired:
        return AUTH_ERROR_MESSAGES.sessionRequired;
      default:
        return errorCode ? AUTH_ERROR_MESSAGES.defaultError : "";
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
      if (result.error === AUTH_ERRORS.oauthAccountOnly) {
        setError("root", {
          message: AUTH_ERROR_MESSAGES.oauthAccountOnly,
        });
      } else {
        setError("root", {
          message: AUTH_ERROR_MESSAGES.credentialsSignin,
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
      title={SIGN_IN_MESSAGES.title}
      description={SIGN_IN_MESSAGES.description}
      className={className}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {SIGN_IN_MESSAGES.footerPrompt}{" "}
          <Link
            href={registerHref}
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            {SIGN_IN_MESSAGES.registerLink}
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
            <FieldLabel htmlFor="email">{SIGN_IN_MESSAGES.emailLabel}</FieldLabel>
            <Input
              id="email"
              type="email"
              sizeVariant="touch"
              autoComplete="email"
              placeholder={SIGN_IN_MESSAGES.emailPlaceholder}
              aria-invalid={!!errors.email}
              disabled={isSubmitting || isGooglePending}
              {...register("email")}
            />
            <FieldError reserveSpace>{errors.email?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">{SIGN_IN_MESSAGES.passwordLabel}</FieldLabel>
            <Input
              id="password"
              type="password"
              sizeVariant="touch"
              autoComplete="current-password"
              placeholder={SIGN_IN_MESSAGES.passwordPlaceholder}
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
          {isSubmitting ? SIGN_IN_MESSAGES.submittingButton : SIGN_IN_MESSAGES.submitButton}
        </Button>
      </form>

      <div className="relative my-4 flex items-center justify-center">
        <Separator className="w-full" />
        <span className="absolute bg-card px-2 text-xs text-muted-foreground uppercase">
          {SIGN_IN_MESSAGES.orContinueWith}
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
        {isGooglePending ? SIGN_IN_MESSAGES.googlePending : SIGN_IN_MESSAGES.googleButton}
      </Button>
    </AuthCard>
  );
}

export default SignIn;
