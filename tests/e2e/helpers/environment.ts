import z from "zod";

export const E2E_ENVIRONMENT_ERRORS = {
  database:
    "E2E_DATABASE_URL must explicitly name a local disposable iiwi_e2e_test, iiwi_ratings_test, or iiwi_ci PostgreSQL database.",
  run: "E2E_TEST_RUN_ID must be the UUID of the test run to create or clean up.",
} as const;

export type E2eEnvironmentVariables = Record<string, string | undefined>;

export function getE2eDatabaseUrl(
  environment: E2eEnvironmentVariables = process.env,
) {
  const connectionString = environment.E2E_DATABASE_URL;
  let databaseUrl: URL;
  try {
    if (!connectionString) throw new Error();
    databaseUrl = new URL(connectionString);
  } catch {
    throw new Error(E2E_ENVIRONMENT_ERRORS.database);
  }
  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(databaseUrl.hostname) ||
    !["/iiwi_e2e_test", "/iiwi_ratings_test", "/iiwi_ci"].includes(
      databaseUrl.pathname,
    ) ||
    databaseUrl.search ||
    databaseUrl.hash
  ) {
    throw new Error(E2E_ENVIRONMENT_ERRORS.database);
  }
  return connectionString;
}

export function getE2eEnvironment(
  environment: E2eEnvironmentVariables = process.env,
) {
  const connectionString = getE2eDatabaseUrl(environment);
  const runId = z.uuid().safeParse(environment.E2E_TEST_RUN_ID);
  if (!runId.success) throw new Error(E2E_ENVIRONMENT_ERRORS.run);
  return { connectionString, runId: runId.data };
}

export type E2eEnvironment = ReturnType<typeof getE2eEnvironment>;
