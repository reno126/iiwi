import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { PrismaClient } from "@/prisma/generated/client";

interface LimitConsumption {
  used: number;
  retryAfterSeconds: number;
}

export interface OperationLease {
  key: string;
  token: string;
}

export function createAbuseStore(
  database: Pick<PrismaClient, "$queryRaw" | "$executeRaw">,
) {
  return {
    async consume(key: string, limit: number, windowSeconds: number) {
      const results = await database.$queryRaw<LimitConsumption[]>`
        INSERT INTO "AbuseBucket" ("key", "used", "expiresAt")
        VALUES (${key}, 1, statement_timestamp() + ${windowSeconds} * interval '1 second')
        ON CONFLICT ("key") DO UPDATE SET
          "used" = CASE WHEN "AbuseBucket"."expiresAt" <= statement_timestamp()
            THEN 1 ELSE CASE WHEN "AbuseBucket"."used" <= ${limit}
              THEN "AbuseBucket"."used" + 1 ELSE "AbuseBucket"."used" END END,
          "expiresAt" = CASE WHEN "AbuseBucket"."expiresAt" <= statement_timestamp()
            THEN EXCLUDED."expiresAt" ELSE "AbuseBucket"."expiresAt" END
        RETURNING "used", GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("expiresAt" - statement_timestamp()))))::int AS "retryAfterSeconds"
      `;
      const result = results[0];
      if (!result) throw new Error("Rate limit storage returned no decision");
      return { ...result, allowed: result.used <= limit };
    },

    async acquireLease(
      key: string,
      durationSeconds: number,
    ): Promise<OperationLease | null> {
      const token = randomUUID();
      const results = await database.$queryRaw<OperationLease[]>`
        INSERT INTO "OperationLease" ("key", "token", "expiresAt")
        VALUES (${key}, ${token}, statement_timestamp() + ${durationSeconds} * interval '1 second')
        ON CONFLICT ("key") DO UPDATE SET
          "token" = EXCLUDED."token", "expiresAt" = EXCLUDED."expiresAt"
        WHERE "OperationLease"."expiresAt" <= statement_timestamp()
        RETURNING "key", "token"
      `;
      return results[0] ?? null;
    },

    async releaseLease(lease: OperationLease): Promise<void> {
      await database.$executeRaw`
        DELETE FROM "OperationLease" WHERE "key" = ${lease.key} AND "token" = ${lease.token}
      `;
    },

    async readScrapeCache(key: string) {
      const results = await database.$queryRaw<Array<{ payload: unknown }>>`
        SELECT "payload" FROM "ScrapeCache" WHERE "key" = ${key} AND "expiresAt" > statement_timestamp()
      `;
      return results[0];
    },

    async writeScrapeCache(
      key: string,
      payload: string,
      ttlSeconds: number,
      lease: OperationLease,
    ): Promise<void> {
      await database.$executeRaw`
        INSERT INTO "ScrapeCache" ("key", "payload", "expiresAt")
        SELECT ${key}, ${payload}::jsonb, statement_timestamp() + ${ttlSeconds} * interval '1 second'
        WHERE EXISTS (
          SELECT 1 FROM "OperationLease" WHERE "key" = ${lease.key}
            AND "token" = ${lease.token} AND "expiresAt" > statement_timestamp()
          FOR SHARE
        )
        ON CONFLICT ("key") DO UPDATE SET "payload" = EXCLUDED."payload", "expiresAt" = EXCLUDED."expiresAt"
      `;
    },

    async pruneExpired(): Promise<void> {
      await database.$executeRaw`
        DELETE FROM "AbuseBucket" WHERE "expiresAt" <= statement_timestamp()
          AND "key" IN (SELECT "key" FROM "AbuseBucket" WHERE "expiresAt" <= statement_timestamp() LIMIT 1000)
      `;
      await database.$executeRaw`
        DELETE FROM "OperationLease" WHERE "expiresAt" <= statement_timestamp()
          AND "key" IN (SELECT "key" FROM "OperationLease" WHERE "expiresAt" <= statement_timestamp() LIMIT 1000)
      `;
      await database.$executeRaw`
        DELETE FROM "ScrapeCache" WHERE "expiresAt" <= statement_timestamp()
          AND "key" IN (SELECT "key" FROM "ScrapeCache" WHERE "expiresAt" <= statement_timestamp() LIMIT 1000)
      `;
    },
  };
}

export const abuseStore = createAbuseStore(prisma);
