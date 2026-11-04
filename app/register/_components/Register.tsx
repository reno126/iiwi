"use client";

import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { useRegisterForm } from "./useRegisterForm";
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

import { REGISTER_MESSAGES } from "../constants";

export { REGISTER_MESSAGES };

interface RegisterProps {
  className?: string;
}

export function Register({ className }: RegisterProps) {
  const { form, onSubmit, loginHref } = useRegisterForm();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

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
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root?.message && (
          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">
              {REGISTER_MESSAGES.nameLabel}
            </FieldLabel>
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
            <FieldLabel htmlFor="email">
              {REGISTER_MESSAGES.emailLabel}
            </FieldLabel>
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
