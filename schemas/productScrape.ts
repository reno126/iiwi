import { z } from "zod";

export const PRODUCT_SCRAPE_ERRORS = {
  invalidUrl: "Podaj prawidłowy adres URL produktu",
  noWhitespace: "Adres URL nie może zawierać spacji",
  invalidProtocol: "Dozwolone są wyłącznie protokoły http:// oraz https://",
} as const;

export const PRODUCT_SCRAPE_MESSAGES = {
  defaultSecurityError:
    "Podany adres URL jest niedozwolony ze względów bezpieczeństwa.",
  scrapeFailedError:
    "Nie udało się automatycznie pobrać danych z podanego linku. Możesz uzupełnić dane ręcznie.",
} as const;

export const productScrapeSchema = z.object({
  productUrl: z
    .url({ message: PRODUCT_SCRAPE_ERRORS.invalidUrl })
    .refine((val) => !/\s/.test(val), {
      message: PRODUCT_SCRAPE_ERRORS.noWhitespace,
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
        message: PRODUCT_SCRAPE_ERRORS.invalidProtocol,
      }
    ),
});

export type ProductScrapeInput = z.infer<typeof productScrapeSchema>;
