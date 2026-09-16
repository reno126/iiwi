"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { CircleAlert } from "lucide-react";

import { registerSchema, type RegisterInput } from "@/schemas/register";
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
      const targetUrl =
        callbackUrl && callbackUrl !== "/dashboard"
          ? callbackUrl
          : getReviewDraftReturnUrl("/dashboard");
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
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            {REGISTER_MESSAGES.loginLink}
          </Link>
        </p>
      }
    >
      {errors.root?.message && (
        <Alert variant="destructive">
          <CircleAlert className="size-4" />
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">
              {REGISTER_MESSAGES.nameLabel}<span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="name"
              sizeVariant="touch"
              placeholder={REGISTER_MESSAGES.namePlaceholder}
              autoComplete="name"
              aria-invalid={!!errors.name}
              disabled={isSubmitting}
              {...register("name")}
            />
            <FieldError reserveSpace>{errors.name?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">
              {REGISTER_MESSAGES.emailLabel} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="email"
              type="email"
              sizeVariant="touch"
              placeholder={REGISTER_MESSAGES.emailPlaceholder}
              autoComplete="email"
              aria-invalid={!!errors.email}
              disabled={isSubmitting}
              {...register("email")}
            />
            <FieldError reserveSpace>{errors.email?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">
              {REGISTER_MESSAGES.passwordLabel} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="password"
              type="password"
              sizeVariant="touch"
              placeholder={REGISTER_MESSAGES.passwordPlaceholder}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              disabled={isSubmitting}
              {...register("password")}
            />
            <FieldError reserveSpace>{errors.password?.message}</FieldError>
          </Field>
        </FieldGroup>

        <Button type="submit" size="touch" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Spinner className="mr-2" />}
          {isSubmitting ? REGISTER_MESSAGES.submittingButton : REGISTER_MESSAGES.submitButton}
        </Button>
      </form>
    </AuthCard>
  );
}
