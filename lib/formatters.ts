import { format } from "date-fns";
import { pl } from "date-fns/locale";

export const REVIEW_COUNT_SUFFIXES = {
  singular: "opinia",
  few: "opinie",
  many: "opinii",
} as const;

export function formatReviewCount(count: number): string {
  if (count === 1) return `1 ${REVIEW_COUNT_SUFFIXES.singular}`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} ${REVIEW_COUNT_SUFFIXES.few}`;
  }
  return `${count} ${REVIEW_COUNT_SUFFIXES.many}`;
}

function isFewProductsQuantity(count: number): boolean {
  const mod10 = count % 10;
  const mod100 = count % 100;
  return mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20);
}

export const RATED_PRODUCTS_MESSAGES = {
  empty: "Jak dotąd nie oceniłeś żadnego produktu",
  singular: "Jak dotąd oceniłeś 1 produkt",
  fewPrefix: "Jak dotąd oceniłeś",
  fewSuffix: "produkty",
  manyPrefix: "Jak dotąd oceniłeś",
  manySuffix: "produktów",
} as const;

export function formatRatedProductsCount(count: number): string {
  if (count === 0) {
    return RATED_PRODUCTS_MESSAGES.empty;
  }
  if (count === 1) {
    return RATED_PRODUCTS_MESSAGES.singular;
  }
  if (isFewProductsQuantity(count)) {
    return `${RATED_PRODUCTS_MESSAGES.fewPrefix} ${count} ${RATED_PRODUCTS_MESSAGES.fewSuffix}`;
  }
  return `${RATED_PRODUCTS_MESSAGES.manyPrefix} ${count} ${RATED_PRODUCTS_MESSAGES.manySuffix}`;
}

export function formatPolishDate(
  date: Date | string,
  formatString: string = "d MMMM yyyy",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, formatString, { locale: pl });
}
