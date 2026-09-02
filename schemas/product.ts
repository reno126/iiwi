import { z } from "zod";

export const productCreateSchema = z.object({
  name: z
    .string({ message: "Product name is required" })
    .min(3, { message: "Product name must be at least 3 characters long" })
    .max(100, { message: "Product name cannot exceed 100 characters" }),
  productUrl: z
    .url({ message: "Please provide a valid product URL" })
    .refine((val) => !/\s/.test(val), {
      message: "URLs cannot contain spaces",
    })
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .url({ message: "Please provide a valid image URL" })
    .refine((val) => !/\s/.test(val), {
      message: "URLs cannot contain spaces",
    })
    .optional()
    .or(z.literal("")),
  code: z
    .string()
    .max(24, { message: "Product code cannot exceed 24 characters" })
    .optional()
    .or(z.literal("")),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
