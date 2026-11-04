import z from "zod";

export const AUTH_EMAIL_ERRORS = {
  invalidEmail: "Podaj prawidłowy adres e-mail",
} as const;

export const authEmailSchema = z
  .string()
  .trim()
  .max(254, { message: AUTH_EMAIL_ERRORS.invalidEmail })
  .pipe(z.email({ message: AUTH_EMAIL_ERRORS.invalidEmail }));
