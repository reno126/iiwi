import { randomUUID } from "node:crypto";
import { mkdtempSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { database, controlPool } from "./helpers/database";
import { cleanupTestRun } from "@/tests/e2e/helpers/cleanupRun";
import { getE2eEnvironment } from "@/tests/e2e/helpers/environment";
import { recordTestUser } from "@/tests/e2e/helpers/runManifest";

describe("PostgreSQL E2E cleanup isolation", () => {
  afterAll(async () => {
    await database.$disconnect();
    await controlPool.end();
  });

  it("deletes only the recorded run's exact user IDs and preserves prefix lookalikes and other runs", async () => {
    const directory = mkdtempSync(join(tmpdir(), "iiwi-cleanup-database-"));
    const environment = {
      E2E_DATABASE_URL: process.env.DATABASE_TEST_URL,
      E2E_TEST_RUN_ID: randomUUID(),
    };
    const testEnvironment = getE2eEnvironment(environment);
    const otherRun = { ...testEnvironment, runId: randomUUID() };
    const ownedUserId = randomUUID();
    const otherRunUserId = randomUUID();
    const ordinaryUsers = [
      "test_",
      "dup_",
      "e2e_user_",
      "val_user_",
      "e2e_authed_",
      "__test__",
    ].map((prefix) => ({
      id: randomUUID(),
      email: `${prefix}${randomUUID()}@cleanup-test.invalid`,
      name: "__test__ Ordinary User",
    }));
    const userIds = [
      ownedUserId,
      otherRunUserId,
      ...ordinaryUsers.map((user) => user.id),
    ];
    const ownedProductId = randomUUID();
    const ordinaryProductId = randomUUID();
    const ordinaryUser = ordinaryUsers[0];
    if (!ordinaryUser) throw new Error("Missing ordinary user fixture");

    try {
      await database.user.createMany({
        data: [
          { id: ownedUserId, email: `${ownedUserId}@cleanup-test.invalid` },
          {
            id: otherRunUserId,
            email: `${otherRunUserId}@cleanup-test.invalid`,
          },
          ...ordinaryUsers,
        ],
      });
      await database.product.createMany({
        data: [
          {
            id: ownedProductId,
            name: "Owned product",
            creatorId: ownedUserId,
            rate_avg: 0,
            rate_count: 0,
          },
          {
            id: ordinaryProductId,
            name: "__test__ Ordinary product",
            creatorId: ordinaryUser.id,
            rate_avg: 5,
            rate_count: 1,
          },
        ],
      });
      const ordinaryReview = await database.review.create({
        data: {
          userId: ordinaryUser.id,
          productId: ordinaryProductId,
          rate: 5,
          description: "Ordinary review",
        },
      });
      recordTestUser(testEnvironment, ownedUserId, directory);
      recordTestUser(otherRun, otherRunUserId, directory);

      expect(await cleanupTestRun(environment, directory)).toEqual({
        count: 1,
      });
      expect(
        await database.user.findUnique({ where: { id: ownedUserId } }),
      ).toBeNull();
      expect(
        await database.product.findUnique({ where: { id: ownedProductId } }),
      ).toBeNull();
      expect(
        await database.user.count({ where: { id: { in: userIds } } }),
      ).toBe(userIds.length - 1);
      expect(
        await database.product.findUnique({ where: { id: ordinaryProductId } }),
      ).not.toBeNull();
      expect(
        await database.review.findUnique({ where: { id: ordinaryReview.id } }),
      ).not.toBeNull();
      expect(await cleanupTestRun(environment, directory)).toEqual({
        count: 0,
      });
    } finally {
      await database.user.deleteMany({ where: { id: { in: userIds } } });
      for (const fileName of readdirSync(directory))
        unlinkSync(join(directory, fileName));
      rmdirSync(directory);
    }
  });
});
