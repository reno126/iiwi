"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import {
  registerSchema,
  registerErrorResponseSchema,
  type RegisterInput,
} from "@/schemas/register";
import { resolveAuthRedirectUrl } from "@/lib/auth/resolveAuthRedirectUrl";
import { REGISTER_MESSAGES } from "../constants";

export function useRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const loginHref =
    callbackUrl && callbackUrl !== "/dashboard"
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (registration: RegisterInput) => {
    form.clearErrors("root");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });

      if (!response.ok) {
        const responseBody: unknown = await response.json().catch(() => null);
        const validatedError =
          registerErrorResponseSchema.safeParse(responseBody);
        form.setError("root", {
          message: validatedError.success
            ? validatedError.data.error
            : REGISTER_MESSAGES.defaultError,
        });
        return;
      }
    } catch {
      form.setError("root", { message: REGISTER_MESSAGES.defaultError });
      return;
    }

    try {
      const result = await signIn("credentials", {
        email: registration.email,
        password: registration.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push(resolveAuthRedirectUrl(callbackUrl));
        router.refresh();
        return;
      }
    } catch {
      router.push(loginHref);
      return;
    }

    router.push(loginHref);
  };

  return { form, onSubmit, loginHref };
}
