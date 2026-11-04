import z from "zod";
import { authEmailSchema, AUTH_EMAIL_ERRORS } from "@/schemas/authEmail";

export const REGISTER_ERRORS = {
  nameMinLength: "Imię musi mieć co najmniej 2 znaki",
  nameMaxLength: "Imię może mieć maksymalnie 100 znaków",
  invalidEmail: AUTH_EMAIL_ERRORS.invalidEmail,
  passwordMinLength: "Hasło musi mieć co najmniej 6 znaków",
  passwordMaxLength: "Hasło może mieć maksymalnie 72 bajty UTF-8",
} as const;

export const REGISTER_API_MESSAGES = {
  invalidData: "Nieprawidłowe dane",
  emailTaken: "Ten adres e-mail jest już zajęty. Zaloguj się na swoje konto.",
  oauthAccountLinked: (providers: string) =>
    `Konto z tym adresem e-mail już istnieje i jest połączone z ${providers}. Zaloguj się przez ${providers}.`,
  userCreated: "Użytkownik został utworzony",
} as const;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, {
      message: REGISTER_ERRORS.nameMinLength,
    })
    .max(100, { message: REGISTER_ERRORS.nameMaxLength }),
  email: authEmailSchema,
  password: z
    .string()
    .min(6, {
      message: REGISTER_ERRORS.passwordMinLength,
    })
    .max(72, { message: REGISTER_ERRORS.passwordMaxLength })
    .refine((password) => new TextEncoder().encode(password).byteLength <= 72, {
      message: REGISTER_ERRORS.passwordMaxLength,
    }),
});

export const registerErrorResponseSchema = z.object({
  error: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
