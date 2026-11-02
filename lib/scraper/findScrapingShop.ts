import { prisma } from "@/lib/db/prisma";
import { isIP } from "node:net";
import type { MatchedShopResult } from "@/lib/shops/findShopByUrl";

export async function findScrapingShop(
  inputUrl: string,
): Promise<MatchedShopResult | null> {
  let targetUrl: URL;
  try {
    targetUrl = new URL(inputUrl);
  } catch {
    return null;
  }

  const hostname = targetUrl.hostname;
  if (
    targetUrl.protocol !== "https:" ||
    targetUrl.port ||
    targetUrl.username ||
    targetUrl.password ||
    !hostname.includes(".") ||
    hostname.endsWith(".") ||
    isIP(hostname) ||
    hostname.includes(":")
  ) {
    return null;
  }

  const permittedKeys = [hostname];
  if (hostname.startsWith("www.")) {
    permittedKeys.push(hostname.slice(4));
  }

  return prisma.shop.findFirst({
    where: { matcherKeys: { hasSome: permittedKeys } },
    orderBy: { id: "asc" },
    select: { id: true, name: true, logo: true },
  });
}
