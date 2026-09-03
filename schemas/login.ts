import z from "zod";

export const loginSchema = z.object({
  email: z.string().email({
    message: "Podaj prawidłowy adres e-mail",
  }),
  password: z.string().min(1, {
    message: "Wprowadź hasło",
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
