"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { CircleAlert } from "lucide-react";

import { registerSchema, type RegisterInput } from "@/schemas/register";
import { resolveAuthRedirectUrl } from "@/lib/auth/resolveAuthRedirectUrl";
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

export const REGISTER_MESSAGES = {
  title: "Utwórz konto",
  description: "Wprowadź swoje dane, aby utworzyć nowe konto",
  footerPrompt: "Masz już konto?",
  loginLink: "Zaloguj się",
  nameLabel: "Imię",
  namePlaceholder: "Jan Kowalski",
  emailLabel: "Adres e-mail",
  emailPlaceholder: "twoj@email.com",
  passwordLabel: "Hasło",
  passwordPlaceholder: "••••••••",
  submitButton: "Zarejestruj się",
  submittingButton: "Tworzenie konta...",
  defaultError: "Wystąpił błąd podczas rejestracji",
} as const;

interface RegisterProps {
  className?: string;
}

export function Register({ className }: RegisterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const loginHref =
    callbackUrl && callbackUrl !== "/dashboard"
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    clearErrors("root");

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const resData = await response.json().catch(() => ({}));
      setError("root", {
        message: resData.error || REGISTER_MESSAGES.defaultError,
      });
      return;
    }

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.ok) {
      const targetUrl = resolveAuthRedirectUrl(callbackUrl);
      router.push(targetUrl);
      router.refresh();
    } else {
      router.push(loginHref);
    }
  };

  return (
    <AuthCard
      title={REGISTER_MESSAGES.title}
      description={REGISTER_MESSAGES.description}
      className={className}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {REGISTER_MESSAGES.footerPrompt}{" "}
          <Link
            href={loginHref}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {REGISTER_MESSAGES.loginLink}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message && (
          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">{REGISTER_MESSAGES.nameLabel}</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder={REGISTER_MESSAGES.namePlaceholder}
              autoComplete="name"
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">{REGISTER_MESSAGES.emailLabel}</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={REGISTER_MESSAGES.emailPlaceholder}
              autoComplete="email"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">
              {REGISTER_MESSAGES.passwordLabel}
            </FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder={REGISTER_MESSAGES.passwordPlaceholder}
              autoComplete="new-password"
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
              {REGISTER_MESSAGES.submittingButton}
            </>
          ) : (
            REGISTER_MESSAGES.submitButton
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
