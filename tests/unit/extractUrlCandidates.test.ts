import { describe, it, expect } from "vitest";
import { extractUrlCandidates } from "@/lib/shops/extractUrlCandidates";

describe("extractUrlCandidates", () => {
  it("extracts hostname and SLD from standard URL with www prefix", () => {
    const candidates = extractUrlCandidates(
      "https://www.mediaexpert.pl/rowery/hulajnogi/hulajnoga-elektryczna"
    );
    expect(candidates).toEqual(["mediaexpert.pl", "mediaexpert"]);
  });

  it("handles URL without protocol automatically", () => {
    const candidates = extractUrlCandidates("mediaexpert.pl/telewizory/oled");
    expect(candidates).toEqual(["mediaexpert.pl", "mediaexpert"]);
  });

  it("handles subdomains by including full host, root domain, and valid labels", () => {
    const candidates = extractUrlCandidates(
      "https://zakupy.biedronka.pl/artykuly-spozywcze/pieczywo"
    );
    expect(candidates).toEqual([
      "zakupy.biedronka.pl",
      "biedronka.pl",
      "biedronka",
    ]);
  });

  it("handles compound second-level domains (e.g. .com.pl)", () => {
    const candidates = extractUrlCandidates("https://www.euro.com.pl/rtv-i-agd/pralki.bhtml");
    expect(candidates).toEqual(["euro.com.pl", "euro"]);
  });

  it("handles labels containing hyphens by providing both hyphenated and unhyphenated candidates", () => {
    const candidates = extractUrlCandidates("https://www.media-markt.pl/pl/category/smartfony");
    expect(candidates).toContain("media-markt.pl");
    expect(candidates).toContain("media-markt");
    expect(candidates).toContain("mediamarkt");
  });

  it("strips queries, ports, and fragments correctly", () => {
    const candidates = extractUrlCandidates(
      "https://allegro.pl:8080/oferta/pralka-bosch-12345?ref=partner#reviews"
    );
    expect(candidates).toEqual(["allegro.pl", "allegro"]);
  });

  it("filters out generic labels such as shop, sklep, m, mobile, pl, com", () => {
    const candidates = extractUrlCandidates("https://m.sklep.action.com/pl-pl/p/123");
    expect(candidates).toContain("action.com");
    expect(candidates).toContain("action");
    expect(candidates).not.toContain("m");
    expect(candidates).not.toContain("sklep");
    expect(candidates).not.toContain("com");
  });

  it("returns empty array for invalid, blank, or non-string inputs", () => {
    expect(extractUrlCandidates(null)).toEqual([]);
    expect(extractUrlCandidates(undefined)).toEqual([]);
    expect(extractUrlCandidates("")).toEqual([]);
    expect(extractUrlCandidates("   ")).toEqual([]);
    expect(extractUrlCandidates("not-a-valid-domain")).toEqual([]);
  });
});
