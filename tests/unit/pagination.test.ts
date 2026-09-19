import { describe, it, expect } from "vitest";
import { generatePaginationPages } from "@/lib/pagination";

describe("lib/pagination", () => {
  it("returns empty array when totalPages is 0 or negative", () => {
    expect(generatePaginationPages(1, 0)).toEqual([]);
    expect(generatePaginationPages(1, -5)).toEqual([]);
  });

  it("returns all pages when totalPages <= 7", () => {
    expect(generatePaginationPages(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(generatePaginationPages(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("returns ellipsis at the end when near the start of large pagination", () => {
    expect(generatePaginationPages(1, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(generatePaginationPages(2, 10)).toEqual([1, 2, 3, "ellipsis", 10]);
  });

  it("returns ellipsis on both sides when in the middle of large pagination", () => {
    expect(generatePaginationPages(5, 10)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      10,
    ]);
  });

  it("returns ellipsis at start when near the end of large pagination", () => {
    expect(generatePaginationPages(9, 10)).toEqual([1, "ellipsis", 8, 9, 10]);
    expect(generatePaginationPages(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  });
});
