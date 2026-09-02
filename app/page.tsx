import { prisma } from "@/lib/db/prisma";

export default async function Home() {
  const t = await prisma.test.findFirst();
  return <div>Strona główna</div>;
}
