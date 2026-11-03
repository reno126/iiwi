import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/prisma/generated/client";

const connectionString = process.env.DATABASE_TEST_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_TEST_URL must point to a disposable PostgreSQL database.",
  );
}

const databaseUrl = new URL(connectionString);
const allowedDatabases = new Set(["/iiwi_ratings_test", "/iiwi_ci"]);
const allowedHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);

if (
  !["postgresql:", "postgres:"].includes(databaseUrl.protocol) ||
  !allowedHosts.has(databaseUrl.hostname) ||
  !allowedDatabases.has(databaseUrl.pathname)
) {
  throw new Error(
    "Database tests require a local iiwi_ratings_test or iiwi_ci database.",
  );
}

export const applicationName = `rating-tests-${randomUUID()}`;
export const database = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    application_name: applicationName,
    max: 10,
  }),
});
export const controlPool = new Pool({ connectionString, max: 2 });
