import { describe, it, expect } from "vitest";
import {
  formatReviewCount,
  formatPolishDate,
  formatPolishDateTime,
  formatRatedProductsCount,
  formatUserDisplayName,
  REVIEW_COUNT_SUFFIXES,
  RATED_PRODUCTS_MESSAGES,
} from "@/lib/formatters";

describe("lib/formatters", () => {
  describe("formatReviewCount", () => {
    it("formats singular 1 as '1 opinia'", () => {
      expect(formatReviewCount(1)).toBe(`1 ${REVIEW_COUNT_SUFFIXES.singular}`);
    });

    it("formats numbers ending in 2, 3, 4 (excluding teens) as 'opinie'", () => {
      expect(formatReviewCount(2)).toBe(`2 ${REVIEW_COUNT_SUFFIXES.few}`);
      expect(formatReviewCount(3)).toBe(`3 ${REVIEW_COUNT_SUFFIXES.few}`);
      expect(formatReviewCount(4)).toBe(`4 ${REVIEW_COUNT_SUFFIXES.few}`);
      expect(formatReviewCount(22)).toBe(`22 ${REVIEW_COUNT_SUFFIXES.few}`);
      expect(formatReviewCount(23)).toBe(`23 ${REVIEW_COUNT_SUFFIXES.few}`);
      expect(formatReviewCount(24)).toBe(`24 ${REVIEW_COUNT_SUFFIXES.few}`);
      expect(formatReviewCount(102)).toBe(`102 ${REVIEW_COUNT_SUFFIXES.few}`);
      expect(formatReviewCount(104)).toBe(`104 ${REVIEW_COUNT_SUFFIXES.few}`);
    });

    it("formats 0 and numbers ending in 5-9 or 0 as 'opinii'", () => {
      expect(formatReviewCount(0)).toBe(`0 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(5)).toBe(`5 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(6)).toBe(`6 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(9)).toBe(`9 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(10)).toBe(`10 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(20)).toBe(`20 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(25)).toBe(`25 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(100)).toBe(`100 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(105)).toBe(`105 ${REVIEW_COUNT_SUFFIXES.many}`);
    });

    it("formats teens (11 to 19) as 'opinii'", () => {
      expect(formatReviewCount(11)).toBe(`11 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(12)).toBe(`12 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(13)).toBe(`13 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(14)).toBe(`14 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(15)).toBe(`15 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(19)).toBe(`19 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(112)).toBe(`112 ${REVIEW_COUNT_SUFFIXES.many}`);
      expect(formatReviewCount(114)).toBe(`114 ${REVIEW_COUNT_SUFFIXES.many}`);
    });
  });

  describe("formatRatedProductsCount", () => {
    it("formats 0 as empty status message", () => {
      expect(formatRatedProductsCount(0)).toBe(RATED_PRODUCTS_MESSAGES.empty);
    });

    it("formats singular 1 as 'Jak dotąd oceniłeś 1 produkt'", () => {
      expect(formatRatedProductsCount(1)).toBe(
        RATED_PRODUCTS_MESSAGES.singular,
      );
    });

    it("formats 2, 3, 4 and non-teen numbers ending in 2, 3, 4 as 'produkty'", () => {
      expect(formatRatedProductsCount(2)).toBe(
        `${RATED_PRODUCTS_MESSAGES.fewPrefix} 2 ${RATED_PRODUCTS_MESSAGES.fewSuffix}`,
      );
      expect(formatRatedProductsCount(3)).toBe(
        `${RATED_PRODUCTS_MESSAGES.fewPrefix} 3 ${RATED_PRODUCTS_MESSAGES.fewSuffix}`,
      );
      expect(formatRatedProductsCount(4)).toBe(
        `${RATED_PRODUCTS_MESSAGES.fewPrefix} 4 ${RATED_PRODUCTS_MESSAGES.fewSuffix}`,
      );
      expect(formatRatedProductsCount(22)).toBe(
        `${RATED_PRODUCTS_MESSAGES.fewPrefix} 22 ${RATED_PRODUCTS_MESSAGES.fewSuffix}`,
      );
      expect(formatRatedProductsCount(104)).toBe(
        `${RATED_PRODUCTS_MESSAGES.fewPrefix} 104 ${RATED_PRODUCTS_MESSAGES.fewSuffix}`,
      );
    });

    it("formats teens and numbers ending in 5-9 or 0 as 'produktów'", () => {
      expect(formatRatedProductsCount(5)).toBe(
        `${RATED_PRODUCTS_MESSAGES.manyPrefix} 5 ${RATED_PRODUCTS_MESSAGES.manySuffix}`,
      );
      expect(formatRatedProductsCount(11)).toBe(
        `${RATED_PRODUCTS_MESSAGES.manyPrefix} 11 ${RATED_PRODUCTS_MESSAGES.manySuffix}`,
      );
      expect(formatRatedProductsCount(12)).toBe(
        `${RATED_PRODUCTS_MESSAGES.manyPrefix} 12 ${RATED_PRODUCTS_MESSAGES.manySuffix}`,
      );
      expect(formatRatedProductsCount(14)).toBe(
        `${RATED_PRODUCTS_MESSAGES.manyPrefix} 14 ${RATED_PRODUCTS_MESSAGES.manySuffix}`,
      );
      expect(formatRatedProductsCount(20)).toBe(
        `${RATED_PRODUCTS_MESSAGES.manyPrefix} 20 ${RATED_PRODUCTS_MESSAGES.manySuffix}`,
      );
      expect(formatRatedProductsCount(100)).toBe(
        `${RATED_PRODUCTS_MESSAGES.manyPrefix} 100 ${RATED_PRODUCTS_MESSAGES.manySuffix}`,
      );
    });
  });

  describe("formatPolishDate", () => {
    it("formats a Date object with Polish locale using default format", () => {
      const date = new Date(2026, 4, 15);
      expect(formatPolishDate(date)).toBe("15 maja 2026");
    });

    it("formats an ISO date string with Polish locale using default format", () => {
      const dateStr = "2026-01-03T10:00:00.000Z";
      expect(formatPolishDate(dateStr)).toMatch(/3 stycznia 2026/);
    });

    it("supports custom formatString parameter", () => {
      const date = new Date(2026, 9, 28);
      expect(formatPolishDate(date, "yyyy-MM-dd")).toBe("2026-10-28");
      expect(formatPolishDate(date, "d MMM yyyy")).toBe("28 paź 2026");
    });
  });

  describe("formatPolishDateTime", () => {
    it("formats date with long Polish date-time format by default and with long variant", () => {
      const date = new Date(2026, 8, 7, 12, 35);
      expect(formatPolishDateTime(date)).toBe("7 września 2026, 12:35");
      expect(formatPolishDateTime(date, "long")).toBe("7 września 2026, 12:35");
    });

    it("formats date with short 3-letter Polish month for mobile variant", () => {
      const date = new Date(2026, 8, 7, 12, 35);
      expect(formatPolishDateTime(date, "short")).toBe("7 wrz 2026, 12:35");
    });
  });

  describe("formatUserDisplayName", () => {
    it("returns trimmed name when user object provides a non-empty name", () => {
      expect(
        formatUserDisplayName({
          name: "  Anna Kowalska  ",
          email: "anna@example.com",
        }),
      ).toBe("Anna Kowalska");
    });

    it("falls back to email prefix before @ when name is null or whitespace", () => {
      expect(
        formatUserDisplayName({
          name: null,
          email: "marek.nowak@domena.pl",
        }),
      ).toBe("marek.nowak");

      expect(
        formatUserDisplayName({
          name: "   ",
          email: "tomasz@example.com",
        }),
      ).toBe("tomasz");
    });

    it("returns default fallback 'Użytkownik' when name and email are missing", () => {
      expect(formatUserDisplayName({ name: null, email: null })).toBe(
        "Użytkownik",
      );
      expect(formatUserDisplayName(null)).toBe("Użytkownik");
      expect(formatUserDisplayName(undefined)).toBe("Użytkownik");
    });

    it("returns custom fallback when specified and both name and email are missing", () => {
      expect(
        formatUserDisplayName(
          { name: null, email: null },
          "Anonimowy użytkownik",
        ),
      ).toBe("Anonimowy użytkownik");
    });
  });
});
