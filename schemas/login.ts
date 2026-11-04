import z from "zod";
import { authEmailSchema, AUTH_EMAIL_ERRORS } from "@/schemas/authEmail";

export const LOGIN_ERRORS = {
  invalidEmail: AUTH_EMAIL_ERRORS.invalidEmail,
  passwordRequired: "Wprowadź hasło",
} as const;

export const loginSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(1, {
    message: LOGIN_ERRORS.passwordRequired,
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
