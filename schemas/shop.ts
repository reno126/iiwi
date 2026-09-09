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
    .string()
    .refine(
      (val) => !val || val.startsWith("/") || /^https?:\/\//i.test(val),
      { message: "Podaj prawidłowy adres URL lub ścieżkę do logo" }
    )
    .nullable()
    .optional()
    .or(z.literal("")),
  matcherKeys: z.array(z.string().min(1)).default([]),
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
    .string()
    .refine(
      (val) => !val || val.startsWith("/") || /^https?:\/\//i.test(val),
      { message: "Podaj prawidłowy adres URL lub ścieżkę do logo" }
    )
    .nullable()
    .optional()
    .or(z.literal("")),
  matcherKeys: z.array(z.string().min(1)).default([]),
});

export type ShopCreateInput = z.infer<typeof shopCreateSchema>;

export const shopMatchSchema = z.object({
  url: z.string().min(1, { message: "Adres URL jest wymagany" }),
});

export type ShopMatchInput = z.infer<typeof shopMatchSchema>;
