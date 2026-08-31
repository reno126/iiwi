import { prisma } from "@/lib/db/prisma";

export default async function Page() {
  const t = await prisma.test.findFirst();
  return <div>Test: {t?.text}</div>;
}
