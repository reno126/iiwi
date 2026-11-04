import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createE2eDatabase } from "./database";
import { getE2eEnvironment } from "./environment";
import { readTestUserIds, recordTestUser } from "./runManifest";
import z from "zod";

const activeRunSchema = z.object({
  connectionString: z.string().min(1),
  runId: z.uuid(),
});
const activeRun = activeRunSchema.parse(
  JSON.parse(readFileSync(resolve(".e2e-runs", "active-run.json"), "utf8")),
);
const environment = getE2eEnvironment({
  E2E_DATABASE_URL: activeRun.connectionString,
  E2E_TEST_RUN_ID: activeRun.runId,
});
export const prisma = createE2eDatabase({
  E2E_DATABASE_URL: environment.connectionString,
  E2E_TEST_RUN_ID: environment.runId,
});

export async function createTestUser(data: {
  email: string;
  name: string;
  password: string;
}) {
  const userId = randomUUID();
  recordTestUser(environment, userId);
  return prisma.user.create({ data: { ...data, id: userId } });
}

export function trackRegisteredTestUser(userId: string) {
  recordTestUser(environment, userId);
}

export async function deleteTestUser(userId: string) {
  if (!readTestUserIds(environment).includes(userId)) {
    throw new Error(
      "Cannot delete a user that is not recorded in this test run.",
    );
  }
  await prisma.user.deleteMany({ where: { id: userId } });
}
