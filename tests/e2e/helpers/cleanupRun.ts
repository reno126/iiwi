import { createE2eDatabase } from "./database";
import { getE2eEnvironment, type E2eEnvironmentVariables } from "./environment";
import { readTestUserIds } from "./runManifest";

export async function cleanupTestRun(
  environment: E2eEnvironmentVariables = process.env,
  manifestDirectory?: string,
) {
  const testEnvironment = getE2eEnvironment(environment);
  const userIds = readTestUserIds(testEnvironment, manifestDirectory);
  const database = createE2eDatabase(environment);
  try {
    return await database.user.deleteMany({ where: { id: { in: userIds } } });
  } finally {
    await database.$disconnect();
  }
}
