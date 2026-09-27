import { z } from "zod";

export const PRODUCT_SCRAPE_ERRORS = {
  invalidUrl: "Podaj prawidłowy adres URL produktu",
  noWhitespace: "Adres URL nie może zawierać spacji",
  invalidProtocol: "Dozwolony jest wyłącznie protokół https://",
} as const;

export const PRODUCT_SCRAPE_MESSAGES = {
  defaultSecurityError:
    "Podany adres URL jest niedozwolony ze względów bezpieczeństwa.",
  scrapeFailedError:
    "Nie udało się automatycznie pobrać danych z podanego linku. Możesz uzupełnić dane ręcznie.",
  unsupportedShopError:
    "Automatyczne pobieranie danych jest obsługiwane wyłącznie dla rozpoznanych sklepów partnerskich. Możesz uzupełnić dane ręcznie.",
} as const;

export const productScrapeSchema = z.object({
  productUrl: z
    .url({ message: PRODUCT_SCRAPE_ERRORS.invalidUrl })
    .refine((urlValue) => !/\s/.test(urlValue), {
      message: PRODUCT_SCRAPE_ERRORS.noWhitespace,
    })
    .refine(
      (urlValue) => {
        try {
          const parsedUrl = new URL(urlValue);
          return parsedUrl.protocol === "https:";
        } catch {
          return false;
        }
      },
      {
        message: PRODUCT_SCRAPE_ERRORS.invalidProtocol,
      },
    ),
});

export type ProductScrapeInput = z.infer<typeof productScrapeSchema>;

export const matchedShopResultSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  logo: z.string().nullable(),
});

export const scrapedMetadataResultSchema = z.object({
  imageUrl: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  shop: matchedShopResultSchema.nullable().optional(),
  scrapedFields: z.array(z.enum(["name", "imageUrl", "code", "shop"])),
});

export type ScrapedMetadataResult = z.infer<typeof scrapedMetadataResultSchema>;
