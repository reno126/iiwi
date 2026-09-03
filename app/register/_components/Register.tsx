"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck } from "lucide-react";

import { registerSchema, type RegisterInput } from "@/schemas/register";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/shadcn/utils";

interface RegisterProps {
  className?: string;
}

export function Register({ className }: RegisterProps) {
  const router = useRouter();
  const [isRegistered, setRegistered] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: RegisterInput) => {
    setApiError("");
    const response = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setRegistered(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      const resData = await response.json().catch(() => ({}));
      setApiError(resData.error || "Wystąpił błąd podczas rejestracji");
    }
  };

  if (isRegistered) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Rejestracja zakończona sukcesem</CardTitle>
          <CardDescription>
            Twoje konto zostało pomyślnie utworzone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
            <CircleCheck className="size-4 text-green-600 dark:text-green-400" />
            <AlertDescription>
              Możesz się teraz zalogować za pomocą swoich danych. Trwa przekierowywanie do strony logowania...
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="justify-center border-t border-border pt-4">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Przejdź do logowania
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Utwórz konto</CardTitle>
        <CardDescription>
          Wprowadź swoje dane, aby utworzyć nowe konto
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {apiError && (
          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">
                Imię<span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                placeholder="Jan Kowalski"
                autoComplete="name"
                aria-invalid={!!errors.name}
                disabled={isSubmitting}
                {...register("name")}
              />
              <FieldError
                role={errors.name ? "alert" : undefined}
                aria-hidden={!errors.name}
                className={cn(
                  "min-h-5 text-sm font-normal text-destructive leading-tight",
                  !errors.name && "invisible",
                )}
              >
                {errors.name?.message || "\u00A0"}
              </FieldError>
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">
                Adres e-mail <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                disabled={isSubmitting}
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
              <FieldLabel htmlFor="password">
                Hasło <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                disabled={isSubmitting}
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

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Spinner className="mr-2" />}
            {isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4">
        <p className="text-center text-sm text-muted-foreground">
          Masz już konto?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Zaloguj się
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
