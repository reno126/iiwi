import { z } from "zod";

export const REVIEW_ERRORS = {
  productIdRequired: "Identyfikator produktu jest wymagany",
  rateRequired: "Ocena jest wymagana",
  rateMin: "Ocena musi wynosić co najmniej 1",
  rateMax: "Ocena nie może przekraczać 5",
  descriptionRequired: "Treść recenzji jest wymagana",
  descriptionMinLength: "Treść recenzji musi mieć co najmniej 3 znaki",
  descriptionMaxLength: "Treść recenzji nie może przekraczać 5000 znaków",
} as const;

export const reviewCreateSchema = z.object({
  productId: z
    .string({ message: REVIEW_ERRORS.productIdRequired })
    .min(1, { message: REVIEW_ERRORS.productIdRequired }),
  rate: z
    .number({ message: REVIEW_ERRORS.rateRequired })
    .min(1, { message: REVIEW_ERRORS.rateMin })
    .max(5, { message: REVIEW_ERRORS.rateMax }),
  description: z
    .string({ message: REVIEW_ERRORS.descriptionRequired })
    .min(3, { message: REVIEW_ERRORS.descriptionMinLength })
    .max(5000, { message: REVIEW_ERRORS.descriptionMaxLength }),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

export const reviewSchema = reviewCreateSchema;
export type ReviewInput = ReviewCreateInput;
