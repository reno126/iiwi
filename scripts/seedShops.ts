import { prisma } from "@/lib/db/prisma";

const INITIAL_SHOPS = [
  {
    name: "Media Expert",
    logo: "/images/shops/mediaexpert.svg",
    matcherKeys: ["mediaexpert.pl", "mediaexpert"],
  },
  {
    name: "Biedronka",
    logo: "/images/shops/biedronka.webp",
    matcherKeys: ["biedronka.pl", "biedronka"],
  },
  {
    name: "Allegro",
    logo: "/images/shops/allegro.svg",
    matcherKeys: ["allegro.pl", "allegro"],
  },
  {
    name: "RTV Euro AGD",
    logo: "/images/shops/euro.svg",
    matcherKeys: ["euro.com.pl", "euro"],
  },
  {
    name: "Action",
    logo: "/images/shops/action.svg",
    matcherKeys: ["action.com", "action"],
  },
  {
    name: "Rossmann",
    logo: "/images/shops/rossmann.svg",
    matcherKeys: ["rossmann.pl", "rossmann"],
  },
  {
    name: "Lidl",
    logo: "/images/shops/lidl.svg",
    matcherKeys: ["lidl.pl", "lidl"],
  },
  {
    name: "Castorama",
    logo: "/images/shops/castorama.svg",
    matcherKeys: ["castorama.pl", "castorama"],
  },
  {
    name: "Morele",
    logo: "/images/shops/morele.svg",
    matcherKeys: ["morele.net", "morele"],
  },
];

async function main() {
  console.log("Seeding shops with matcher keys...");

  for (const shop of INITIAL_SHOPS) {
    const existing = await prisma.shop.findUnique({
      where: { name: shop.name },
    });

    if (existing) {
      await prisma.shop.update({
        where: { id: existing.id },
        data: {
          logo: shop.logo,
          matcherKeys: shop.matcherKeys,
        },
      });
      console.log(`Updated shop: ${shop.name}`);
    } else {
      await prisma.shop.create({
        data: {
          name: shop.name,
          logo: shop.logo,
          matcherKeys: shop.matcherKeys,
        },
      });
      console.log(`Created shop: ${shop.name}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
