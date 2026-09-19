import { z } from "zod";

export const PRODUCT_ERRORS = {
  nameRequired: "Nazwa produktu jest wymagana",
  nameMinLength: "Nazwa produktu musi mieć co najmniej 3 znaki",
  nameMaxLength: "Nazwa produktu nie może przekraczać 100 znaków",
  productUrlInvalid: "Podaj prawidłowy adres URL produktu",
  productUrlNoSpaces: "Adres URL nie może zawierać spacji",
  imageUrlInvalid: "Podaj prawidłowy adres URL obrazu",
  imageUrlNoSpaces: "Adres URL nie może zawierać spacji",
  codeMaxLength: "Kod produktu nie może przekraczać 24 znaków",
  idRequired: "ID produktu jest wymagane",
} as const;

export const productCreateSchema = z.object({
  name: z
    .string({ message: PRODUCT_ERRORS.nameRequired })
    .min(3, { message: PRODUCT_ERRORS.nameMinLength })
    .max(100, { message: PRODUCT_ERRORS.nameMaxLength }),
  productUrl: z
    .url({ message: PRODUCT_ERRORS.productUrlInvalid })
    .refine((val) => !/\s/.test(val), {
      message: PRODUCT_ERRORS.productUrlNoSpaces,
    })
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .url({ message: PRODUCT_ERRORS.imageUrlInvalid })
    .refine((val) => !/\s/.test(val), {
      message: PRODUCT_ERRORS.imageUrlNoSpaces,
    })
    .optional()
    .or(z.literal("")),
  code: z
    .string()
    .max(24, { message: PRODUCT_ERRORS.codeMaxLength })
    .optional()
    .or(z.literal("")),
  shopId: z.string().optional().or(z.literal("")),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productIdSchema = z.object({
  id: z.string().min(1, { message: PRODUCT_ERRORS.idRequired }),
});

export type ProductIdInput = z.infer<typeof productIdSchema>;

export const reconstructRatingsSchema = z.object({
  productId: z.string().optional(),
});

export type ReconstructRatingsInput = z.infer<typeof reconstructRatingsSchema>;
