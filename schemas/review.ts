import { z } from "zod";

export const reviewCreateSchema = z.object({
  productId: z
    .string({ message: "Identyfikator produktu jest wymagany" })
    .min(1, { message: "Identyfikator produktu jest wymagany" }),
  rate: z
    .number({ message: "Ocena jest wymagana" })
    .min(1, { message: "Ocena musi wynosić co najmniej 1" })
    .max(5, { message: "Ocena nie może przekraczać 5" }),
  description: z
    .string({ message: "Treść recenzji jest wymagana" })
    .min(3, { message: "Treść recenzji musi mieć co najmniej 3 znaki" })
    .max(5000, { message: "Treść recenzji nie może przekraczać 5000 znaków" }),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

export const reviewSchema = reviewCreateSchema;
export type ReviewInput = ReviewCreateInput;
