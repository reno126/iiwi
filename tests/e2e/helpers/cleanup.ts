import { prisma } from "@/lib/db/prisma";
import { E2E_TEST_PREFIX } from "./auth";

async function main() {
  console.log(
    `Cleaning test database records with prefix "${E2E_TEST_PREFIX}"...`,
  );

  const deletedProducts = await prisma.product.deleteMany({
    where: {
      OR: [
        { name: { startsWith: E2E_TEST_PREFIX } },
        { code: { startsWith: E2E_TEST_PREFIX } },
      ],
    },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: E2E_TEST_PREFIX } },
        { name: { startsWith: E2E_TEST_PREFIX } },
        { email: { startsWith: "test_" } },
        { email: { startsWith: "dup_" } },
        { email: { startsWith: "e2e_user_" } },
        { email: { startsWith: "val_user_" } },
        { email: { startsWith: "e2e_authed_" } },
      ],
    },
  });

  console.log(
    `Cleanup complete! Deleted ${deletedProducts.count} test product(s) and ${deletedUsers.count} test user(s).`,
  );
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
