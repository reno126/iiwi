import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import z from "zod";
import type { E2eEnvironment } from "./environment";

const manifestEntrySchema = z.object({
  runId: z.uuid(),
  databaseHash: z.string(),
  userId: z.string().min(1).max(256),
});

function getManifestIdentity(environment: E2eEnvironment) {
  return {
    runId: z.uuid().parse(environment.runId),
    databaseHash: createHash("sha256")
      .update(environment.connectionString)
      .digest("hex"),
  };
}

export function recordTestUser(
  environment: E2eEnvironment,
  userId: string,
  directory = resolve(".e2e-runs"),
) {
  const entry = manifestEntrySchema.parse({
    ...getManifestIdentity(environment),
    userId,
  });
  mkdirSync(directory, { recursive: true });
  appendFileSync(
    resolve(directory, `${entry.runId}.jsonl`),
    `${JSON.stringify(entry)}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}

export function readTestUserIds(
  environment: E2eEnvironment,
  directory = resolve(".e2e-runs"),
) {
  const identity = getManifestIdentity(environment);
  const manifest = readFileSync(
    resolve(directory, `${identity.runId}.jsonl`),
    "utf8",
  );
  const entries = manifest
    .trim()
    .split("\n")
    .map((line) => manifestEntrySchema.parse(JSON.parse(line)));
  if (
    entries.some(
      (entry) =>
        entry.runId !== identity.runId ||
        entry.databaseHash !== identity.databaseHash,
    )
  ) {
    throw new Error(
      "The cleanup manifest does not belong to this database and test run.",
    );
  }
  return [...new Set(entries.map((entry) => entry.userId))];
}
