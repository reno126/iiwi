import { prisma } from "@/lib/db/prisma";
import { extractUrlCandidates } from "@/lib/shops/extractUrlCandidates";

export interface MatchedShopResult {
  id: string;
  name: string | null;
  logo: string | null;
}

interface RankedShop {
  id: string;
  name: string | null;
  logo: string | null;
  matcherKeys: string[];
}

function compareShopsByCandidatePriority(
  firstShop: RankedShop,
  secondShop: RankedShop,
  candidates: string[],
): number {
  function findBestCandidateRank(shopKeys: string[]): number {
    for (let index = 0; index < candidates.length; index++) {
      const candidate = candidates[index];
      if (candidate && shopKeys.includes(candidate)) {
        return index;
      }
    }
    return Number.MAX_SAFE_INTEGER;
  }

  return (
    findBestCandidateRank(firstShop.matcherKeys) -
    findBestCandidateRank(secondShop.matcherKeys)
  );
}

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
  const singleShop = matchedShops[0];
  if (matchedShops.length === 1 && singleShop) {
    const { id, name, logo } = singleShop;
    return { id, name, logo };
  }

  matchedShops.sort((firstShop, secondShop) =>
    compareShopsByCandidatePriority(firstShop, secondShop, candidates),
  );

  const bestRankedShop = matchedShops[0];
  if (!bestRankedShop) return null;

  return {
    id: bestRankedShop.id,
    name: bestRankedShop.name,
    logo: bestRankedShop.logo,
  };
}
