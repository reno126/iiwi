"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";

import { loginSchema, type LoginInput } from "@/schemas/login";
import { AUTH_ERRORS, AUTH_ERROR_MESSAGES } from "@/lib/auth/constants";
import { getAuthErrorMessage } from "@/lib/auth/getAuthErrorMessage";
import { resolveAuthRedirectUrl } from "@/lib/auth/resolveAuthRedirectUrl";
import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
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

  const urlError = getAuthErrorMessage(searchParams.get("error"));
  const displayedError = errors.root?.message || urlError;

  const onSubmit = async (data: LoginInput) => {
    clearErrors("root");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("root", {
        message:
          result.error === AUTH_ERRORS.oauthAccountOnly
            ? AUTH_ERROR_MESSAGES.oauthAccountOnly
            : AUTH_ERROR_MESSAGES.credentialsSignin,
      });
      return;
    }

    if (result?.ok) {
      const targetUrl = resolveAuthRedirectUrl(callbackUrl);
      router.push(targetUrl);
      router.refresh();
    }
  };

  const googleCallbackUrl = resolveAuthRedirectUrl(callbackUrl);

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
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {SIGN_IN_MESSAGES.registerLink}
          </Link>
        </p>
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {displayedError && (
          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertDescription>{displayedError}</AlertDescription>
          </Alert>
        )}

        <FieldGroup>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">{SIGN_IN_MESSAGES.emailLabel}</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={SIGN_IN_MESSAGES.emailPlaceholder}
              autoComplete="email"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">
              {SIGN_IN_MESSAGES.passwordLabel}
            </FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder={SIGN_IN_MESSAGES.passwordPlaceholder}
              autoComplete="current-password"
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </Field>
        </FieldGroup>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-4" />
              {SIGN_IN_MESSAGES.submittingButton}
            </>
          ) : (
            SIGN_IN_MESSAGES.submitButton
          )}
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            {SIGN_IN_MESSAGES.orContinueWith}
          </span>
        </div>
      </div>

      <GoogleSignInButton
        callbackUrl={googleCallbackUrl}
        disabled={isSubmitting}
        buttonText={SIGN_IN_MESSAGES.googleButton}
        pendingText={SIGN_IN_MESSAGES.googlePending}
      />
    </AuthCard>
  );
}
