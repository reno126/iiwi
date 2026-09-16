import z from "zod";

export const REGISTER_ERRORS = {
  nameMinLength: "Imię musi mieć co najmniej 2 znaki",
  invalidEmail: "Podaj prawidłowy adres e-mail",
  passwordMinLength: "Hasło musi mieć co najmniej 6 znaków",
} as const;

export const registerSchema = z.object({
  name: z.string().min(2, {
    message: REGISTER_ERRORS.nameMinLength,
  }),
  email: z.email({
    message: REGISTER_ERRORS.invalidEmail,
  }),
  password: z.string().min(6, {
    message: REGISTER_ERRORS.passwordMinLength,
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
