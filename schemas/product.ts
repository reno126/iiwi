import { z } from "zod";

export const productCreateSchema = z.object({
  name: z
    .string({ message: "Nazwa produktu jest wymagana" })
    .min(3, { message: "Nazwa produktu musi mieć co najmniej 3 znaki" })
    .max(100, { message: "Nazwa produktu nie może przekraczać 100 znaków" }),
  productUrl: z
    .url({ message: "Podaj prawidłowy adres URL produktu" })
    .refine((val) => !/\s/.test(val), {
      message: "Adres URL nie może zawierać spacji",
    })
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .url({ message: "Podaj prawidłowy adres URL obrazu" })
    .refine((val) => !/\s/.test(val), {
      message: "Adres URL nie może zawierać spacji",
    })
    .optional()
    .or(z.literal("")),
  code: z
    .string()
    .max(24, { message: "Kod produktu nie może przekraczać 24 znaków" })
    .optional()
    .or(z.literal("")),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productIdSchema = z.object({
  id: z.string().min(1, { message: "ID produktu jest wymagane" }),
});

export type ProductIdInput = z.infer<typeof productIdSchema>;
