import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client";
import { getE2eEnvironment, type E2eEnvironmentVariables } from "./environment";

export function createE2eDatabase(
  environment: E2eEnvironmentVariables = process.env,
) {
  const { connectionString } = getE2eEnvironment(environment);
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
