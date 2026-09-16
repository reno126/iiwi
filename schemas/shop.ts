import { z } from "zod";

export const SHOP_ERRORS = {
  idRequired: "ID sklepu jest wymagane",
  nameRequired: "Nazwa sklepu jest wymagana",
  nameMinLength: "Nazwa sklepu musi mieć co najmniej 3 znaki",
  nameMaxLength: "Nazwa sklepu nie może przekraczać 24 znaków",
  invalidLogo: "Podaj prawidłowy adres URL lub ścieżkę do logo",
  urlRequired: "Adres URL jest wymagany",
} as const;

export const shopSchema = z.object({
  id: z.string().min(1, { message: SHOP_ERRORS.idRequired }),
  name: z
    .string()
    .min(3, { message: SHOP_ERRORS.nameMinLength })
    .max(24, { message: SHOP_ERRORS.nameMaxLength })
    .nullable()
    .optional(),
  logo: z
    .string()
    .refine(
      (val) => !val || val.startsWith("/") || /^https?:\/\//i.test(val),
      { message: SHOP_ERRORS.invalidLogo }
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
    .string({ message: SHOP_ERRORS.nameRequired })
    .min(3, { message: SHOP_ERRORS.nameMinLength })
    .max(24, { message: SHOP_ERRORS.nameMaxLength })
    .nullable()
    .optional(),
  logo: z
    .string()
    .refine(
      (val) => !val || val.startsWith("/") || /^https?:\/\//i.test(val),
      { message: SHOP_ERRORS.invalidLogo }
    )
    .nullable()
    .optional()
    .or(z.literal("")),
  matcherKeys: z.array(z.string().min(1)).default([]),
});

export type ShopCreateInput = z.infer<typeof shopCreateSchema>;

export const shopMatchSchema = z.object({
  url: z.string().min(1, { message: SHOP_ERRORS.urlRequired }),
});

export type ShopMatchInput = z.infer<typeof shopMatchSchema>;
