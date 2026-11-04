import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getE2eDatabaseUrl } from "./helpers/environment";

export default function globalSetup() {
  process.env.E2E_DATABASE_URL = getE2eDatabaseUrl();
  process.env.E2E_TEST_RUN_ID ??= randomUUID();
  mkdirSync(".e2e-runs", { recursive: true });
  writeFileSync(
    resolve(".e2e-runs", "active-run.json"),
    JSON.stringify({
      connectionString: process.env.E2E_DATABASE_URL,
      runId: process.env.E2E_TEST_RUN_ID,
    }),
    { encoding: "utf8", mode: 0o600 },
  );
  console.log(`E2E test run: ${process.env.E2E_TEST_RUN_ID}`);
}
