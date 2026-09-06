import { format } from "date-fns";
import { pl } from "date-fns/locale";

export function formatReviewCount(count: number): string {
  if (count === 1) return "1 opinia";
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} opinie`;
  }
  return `${count} opinii`;
}

export function formatPolishDate(
  date: Date | string,
  formatString: string = "d MMMM yyyy",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, formatString, { locale: pl });
}
