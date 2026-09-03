import z from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, {
    message: "Imię musi mieć co najmniej 2 znaki",
  }),
  email: z.string().email({
    message: "Podaj prawidłowy adres e-mail",
  }),
  password: z.string().min(6, {
    message: "Hasło musi mieć co najmniej 6 znaków",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
