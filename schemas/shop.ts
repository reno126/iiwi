import { z } from "zod";

export const shopSchema = z.object({
  id: z.string().min(1, { message: "ID sklepu jest wymagane" }),
  name: z
    .string()
    .min(3, { message: "Nazwa sklepu musi mieć co najmniej 3 znaki" })
    .max(24, { message: "Nazwa sklepu nie może przekraczać 24 znaków" })
    .nullable()
    .optional(),
  logo: z
    .url({ message: "Podaj prawidłowy adres URL logo" })
    .nullable()
    .optional()
    .or(z.literal("")),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ShopInput = z.infer<typeof shopSchema>;

export const shopCreateSchema = z.object({
  name: z
    .string({ message: "Nazwa sklepu jest wymagana" })
    .min(3, { message: "Nazwa sklepu musi mieć co najmniej 3 znaki" })
    .max(24, { message: "Nazwa sklepu nie może przekraczać 24 znaków" })
    .nullable()
    .optional(),
  logo: z
    .url({ message: "Podaj prawidłowy adres URL logo" })
    .nullable()
    .optional()
    .or(z.literal("")),
});

export type ShopCreateInput = z.infer<typeof shopCreateSchema>;
