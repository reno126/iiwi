import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { shop: { findFirst } } }));

import { findScrapingShop } from "@/lib/scraper/findScrapingShop";

const shop = { id: "allegro", name: "Allegro", logo: null };

beforeEach(() => {
  findFirst.mockReset();
  findFirst.mockImplementation(({ where }) =>
    Promise.resolve(
      where.matcherKeys.hasSome.includes("allegro.pl") ? shop : null,
    ),
  );
});

describe("scraping host authorization", () => {
  it.each([
    "https://allegro.pl/item",
    "https://www.allegro.pl/item",
    "https://ALLEGRO.PL:443/item",
  ])("accepts configured domains and their www alias: %s", async (url) => {
    expect(await findScrapingShop(url)).toEqual(shop);
  });

  it.each([
    "https://allegro.attacker.example/item",
    "https://allegro.pl.attacker.example/item",
    "https://fakeallegro.pl/item",
    "https://unconfigured.allegro.pl/item",
  ])("rejects brand labels and unconfigured subdomains: %s", async (url) => {
    expect(await findScrapingShop(url)).toBeNull();
  });

  it.each([
    "http://allegro.pl/item",
    "https://allegro.pl:8443/item",
    "https://user:password@allegro.pl/item",
    "https://allegro.pl./item",
    "https://127.0.0.1/item",
    "https://[::1]/item",
    "invalid",
  ])("rejects disallowed URL forms before querying shops: %s", async (url) => {
    expect(await findScrapingShop(url)).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });
});
