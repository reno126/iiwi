import z from "zod";

export const LOGIN_ERRORS = {
  invalidEmail: "Podaj prawidłowy adres e-mail",
  passwordRequired: "Wprowadź hasło",
} as const;

export const loginSchema = z.object({
  email: z.email({
    message: LOGIN_ERRORS.invalidEmail,
  }),
  password: z.string().min(1, {
    message: LOGIN_ERRORS.passwordRequired,
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
