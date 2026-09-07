import { z } from "zod";

export const productScrapeSchema = z.object({
  productUrl: z
    .url({ message: "Podaj prawidłowy adres URL produktu" })
    .refine((val) => !/\s/.test(val), {
      message: "Adres URL nie może zawierać spacji",
    })
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      {
        message: "Dozwolone są wyłącznie protokoły http:// oraz https://",
      }
    ),
});

export type ProductScrapeInput = z.infer<typeof productScrapeSchema>;
