import { prisma } from "@/lib/db/prisma";
import { extractUrlCandidates } from "@/lib/shops/extractUrlCandidates";

export interface MatchedShopResult {
  id: string;
  name: string | null;
  logo: string | null;
}

/**
 * Dopasowuje sklep na podstawie adresu URL produktu.
 * Wykorzystuje zapytanie PostgreSQL z operatorem przecięcia tablic (Prisma `hasSome` z indeksem GIN).
 */
export async function findShopByUrl(
  url: string | null | undefined,
): Promise<MatchedShopResult | null> {
  const candidates = extractUrlCandidates(url);
  if (candidates.length === 0) return null;

  const matchedShops = await prisma.shop.findMany({
    where: {
      matcherKeys: {
        hasSome: candidates,
      },
    },
    select: {
      id: true,
      name: true,
      logo: true,
      matcherKeys: true,
    },
  });

  if (matchedShops.length === 0) return null;
  if (matchedShops.length === 1) {
    const { id, name, logo } = matchedShops[0];
    return { id, name, logo };
  }

  // Tie-breaking: dopasowanie o najwyższym priorytecie wg kolejności kandydatów
  matchedShops.sort((a, b) => {
    const getBestRank = (shopKeys: string[]) => {
      for (let i = 0; i < candidates.length; i++) {
        if (shopKeys.includes(candidates[i])) return i;
      }
      return 999;
    };
    return getBestRank(a.matcherKeys) - getBestRank(b.matcherKeys);
  });

  const best = matchedShops[0];
  return { id: best.id, name: best.name, logo: best.logo };
}
