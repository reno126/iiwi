import { describe, it, expect } from "vitest";
import { formatReviewCount, formatPolishDate } from "@/lib/formatters";

describe("lib/formatters", () => {
  describe("formatReviewCount", () => {
    it("formats singular 1 as '1 opinia'", () => {
      expect(formatReviewCount(1)).toBe("1 opinia");
    });

    it("formats numbers ending in 2, 3, 4 (excluding teens) as 'opinie'", () => {
      expect(formatReviewCount(2)).toBe("2 opinie");
      expect(formatReviewCount(3)).toBe("3 opinie");
      expect(formatReviewCount(4)).toBe("4 opinie");
      expect(formatReviewCount(22)).toBe("22 opinie");
      expect(formatReviewCount(23)).toBe("23 opinie");
      expect(formatReviewCount(24)).toBe("24 opinie");
      expect(formatReviewCount(102)).toBe("102 opinie");
      expect(formatReviewCount(104)).toBe("104 opinie");
    });

    it("formats 0 and numbers ending in 5-9 or 0 as 'opinii'", () => {
      expect(formatReviewCount(0)).toBe("0 opinii");
      expect(formatReviewCount(5)).toBe("5 opinii");
      expect(formatReviewCount(6)).toBe("6 opinii");
      expect(formatReviewCount(9)).toBe("9 opinii");
      expect(formatReviewCount(10)).toBe("10 opinii");
      expect(formatReviewCount(20)).toBe("20 opinii");
      expect(formatReviewCount(25)).toBe("25 opinii");
      expect(formatReviewCount(100)).toBe("100 opinii");
      expect(formatReviewCount(105)).toBe("105 opinii");
    });

    it("formats teens (11 to 19) as 'opinii'", () => {
      expect(formatReviewCount(11)).toBe("11 opinii");
      expect(formatReviewCount(12)).toBe("12 opinii");
      expect(formatReviewCount(13)).toBe("13 opinii");
      expect(formatReviewCount(14)).toBe("14 opinii");
      expect(formatReviewCount(15)).toBe("15 opinii");
      expect(formatReviewCount(19)).toBe("19 opinii");
      expect(formatReviewCount(112)).toBe("112 opinii");
      expect(formatReviewCount(114)).toBe("114 opinii");
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
});
