import { randomUUID } from "node:crypto";
import {
  appendFileSync,
  mkdtempSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupTestRun } from "@/tests/e2e/helpers/cleanupRun";
import { createE2eDatabase } from "@/tests/e2e/helpers/database";
import {
  getE2eEnvironment,
  E2E_ENVIRONMENT_ERRORS,
} from "@/tests/e2e/helpers/environment";
import type { E2eEnvironmentVariables } from "@/tests/e2e/helpers/environment";
import {
  readTestUserIds,
  recordTestUser,
} from "@/tests/e2e/helpers/runManifest";

vi.mock("@/tests/e2e/helpers/database", () => ({ createE2eDatabase: vi.fn() }));

describe("E2E cleanup safety", () => {
  let directory: string;
  let environment: E2eEnvironmentVariables;

  beforeEach(() => {
    vi.clearAllMocks();
    directory = mkdtempSync(join(tmpdir(), "iiwi-cleanup-unit-"));
    environment = {
      E2E_DATABASE_URL:
        "postgresql://test:password@localhost:5432/iiwi_e2e_test",
      E2E_TEST_RUN_ID: randomUUID(),
    };
  });

  afterEach(() => {
    for (const fileName of readdirSync(directory))
      unlinkSync(join(directory, fileName));
    rmdirSync(directory);
  });

  it.each([
    undefined,
    "",
    "invalid-url",
    "postgresql://localhost/production",
    "postgresql://remote.example/iiwi_ci",
    "https://localhost/iiwi_ci",
    "postgresql://localhost/iiwi_ci?host=remote.example",
    "postgresql://localhost/iiwi_ci?schema=production",
    "postgresql://localhost/iiwi_ci#fragment",
  ])(
    "rejects an unapproved database before creating a client",
    async (connectionString) => {
      environment.E2E_DATABASE_URL = connectionString;
      environment.DATABASE_URL = "postgresql://localhost/iiwi_ci";
      await expect(cleanupTestRun(environment, directory)).rejects.toThrow(
        E2E_ENVIRONMENT_ERRORS.database,
      );
      expect(createE2eDatabase).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, "", "../../production", "not-a-run-id"])(
    "requires an explicit valid run ID before creating a client",
    async (runId) => {
      environment.E2E_TEST_RUN_ID = runId;
      await expect(cleanupTestRun(environment, directory)).rejects.toThrow(
        E2E_ENVIRONMENT_ERRORS.run,
      );
      expect(createE2eDatabase).not.toHaveBeenCalled();
    },
  );

  it("refuses cleanup without a recorded manifest", async () => {
    await expect(cleanupTestRun(environment, directory)).rejects.toThrow();
    expect(createE2eDatabase).not.toHaveBeenCalled();
  });

  it("refuses a manifest bound to another database", async () => {
    recordTestUser(getE2eEnvironment(environment), randomUUID(), directory);
    environment.E2E_DATABASE_URL =
      "postgresql://test:password@localhost:5433/iiwi_ci";
    await expect(cleanupTestRun(environment, directory)).rejects.toThrow(
      "does not belong",
    );
    expect(createE2eDatabase).not.toHaveBeenCalled();
  });

  it("rejects a corrupt trailing entry before deleting any valid entries", async () => {
    recordTestUser(getE2eEnvironment(environment), randomUUID(), directory);
    appendFileSync(
      join(directory, `${environment.E2E_TEST_RUN_ID}.jsonl`),
      "{unfinished",
    );
    await expect(cleanupTestRun(environment, directory)).rejects.toThrow();
    expect(createE2eDatabase).not.toHaveBeenCalled();
  });

  it("rejects an empty manifest before creating a client", async () => {
    writeFileSync(join(directory, `${environment.E2E_TEST_RUN_ID}.jsonl`), "");
    await expect(cleanupTestRun(environment, directory)).rejects.toThrow();
    expect(createE2eDatabase).not.toHaveBeenCalled();
  });

  it("keeps exact user IDs separated by test run and deduplicates repeated records", () => {
    const firstRun = getE2eEnvironment(environment);
    const secondRun = { ...firstRun, runId: randomUUID() };
    const firstUserId = randomUUID();
    const secondUserId = randomUUID();
    recordTestUser(firstRun, firstUserId, directory);
    recordTestUser(secondRun, secondUserId, directory);
    recordTestUser(firstRun, firstUserId, directory);
    expect(readTestUserIds(firstRun, directory)).toEqual([firstUserId]);
    expect(readTestUserIds(secondRun, directory)).toEqual([secondUserId]);
  });
});
