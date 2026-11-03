import { abuseStore } from "@/lib/abuse/store";
import { getClientIdentity, hashAbuseKey } from "@/lib/abuse/clientIdentity";
import { AbuseLimitError } from "@/lib/abuse/errors";

export const REQUEST_LIMITS = {
  register: { global: 60, client: 5, windowSeconds: 900 },
  login: { global: 300, client: 30, windowSeconds: 900 },
  scrape: { global: 300, client: 20, windowSeconds: 900 },
} as const;

export const SCRAPE_QUOTAS = {
  guest: 5,
  account: 30,
  windowSeconds: 3600,
} as const;

export async function enforceLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const result = await abuseStore.consume(key, limit, windowSeconds);
  if (!result.allowed) throw new AbuseLimitError(result.retryAfterSeconds);
}

export async function enforceRequestLimits(
  operation: keyof typeof REQUEST_LIMITS,
  requestHeaders: Pick<Headers, "get">,
): Promise<string> {
  const policy = REQUEST_LIMITS[operation];
  const clientIdentity = getClientIdentity(requestHeaders);
  const globalResult = await abuseStore.consume(
    `${operation}:global`,
    policy.global,
    policy.windowSeconds,
  );
  if (!globalResult.allowed)
    throw new AbuseLimitError(globalResult.retryAfterSeconds);
  if (globalResult.used === 1) await abuseStore.pruneExpired();
  await enforceLimit(
    `${operation}:client:${clientIdentity}`,
    policy.client,
    policy.windowSeconds,
  );
  return clientIdentity;
}

export async function enforceAccountLimit(
  operation: "register" | "login",
  email: string,
): Promise<void> {
  await enforceLimit(
    `${operation}:account:${hashAbuseKey(email.trim().toLowerCase())}`,
    operation === "login" ? 10 : 3,
    900,
  );
}

export async function enforceScrapeQuota(
  clientIdentity: string,
  userId?: string,
): Promise<void> {
  const subject = userId
    ? `account:${hashAbuseKey(userId)}`
    : `guest:${clientIdentity}`;
  await enforceLimit(
    `scrape:${subject}`,
    userId ? SCRAPE_QUOTAS.account : SCRAPE_QUOTAS.guest,
    SCRAPE_QUOTAS.windowSeconds,
  );
}

export function getPaidScrapeLimit(): number {
  const configuredLimit = process.env.ZENROWS_DAILY_REQUEST_LIMIT?.trim();
  if (!configuredLimit) return 100;
  const limit = Number(configuredLimit);
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 100000) {
    throw new Error(
      "ZENROWS_DAILY_REQUEST_LIMIT must be an integer between 0 and 100000",
    );
  }
  return limit;
}

export async function reservePaidScrape(): Promise<boolean> {
  const limit = getPaidScrapeLimit();
  if (limit === 0) return false;
  return (await abuseStore.consume("zenrows:global", limit, 86400)).allowed;
}
