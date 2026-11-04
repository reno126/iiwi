# Public operation abuse controls

Registration, credentials login, and product scraping use PostgreSQL counters shared by every application instance. Apply `pnpm prisma:deploy` before deploying this change, then generate the Prisma client with `pnpm prisma:generate`. No Redis service is required. If the shared store cannot be reached, these operations stop before password hashing/comparison or outbound scraping.

## Request limits

The defaults are defined in `lib/abuse/limits.ts`:

| Operation         | Global allowance | Per-client allowance | Per-account allowance                                            |
| ----------------- | ---------------- | -------------------- | ---------------------------------------------------------------- |
| Registration      | 60 / 15 minutes  | 5 / 15 minutes       | 3 / 15 minutes per submitted email                               |
| Credentials login | 300 / 15 minutes | 30 / 15 minutes      | 10 / 15 minutes per submitted email                              |
| Product scraping  | 300 / 15 minutes | 20 / 15 minutes      | 30 / hour per authenticated user; guests get 5 / hour per client |

All attempts, including failed attempts and cached scrape requests, consume allowances. Windows begin at the first admitted request and reset after expiry; denied requests do not extend them. The global check runs first to bound the number of new client/account keys. Email trimming and case folding apply only to quota keys and do not change authentication or registration semantics. Signed-in users retain the client limit as well as their account quota.

Registration returns HTTP 429 with `Retry-After`. Login and scrape forms show a retry message. Registration returns 503 if protection is unavailable; login and server actions return a generic unavailable error. Existing authentication, validation, and SSRF checks remain in effect.

## Trusted client addresses

On Vercel (`VERCEL=1`), the application uses `x-vercel-forwarded-for`, the platform's client address header. See [Vercel request header documentation](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for).

For another deployment, set `ABUSE_TRUSTED_IP_HEADER` to a header that the trusted ingress **overwrites with exactly one client IP** on every request, such as `x-client-ip`. The application server must only be reachable through that ingress. Do not configure a header that callers can supply unchanged. Comma-separated forwarding chains are rejected instead of guessing which hop is trusted.

Without a configured trusted header, or if the address is absent/invalid, requests share an `unknown-client` bucket. This conservative fallback also applies to local development. Arbitrary `x-forwarded-for`, cookies, and request bodies cannot create new identities. IPv4-mapped IPv6 addresses share their IPv4 bucket; IPv6 addresses share a /64 bucket. Keys store SHA-256 digests instead of raw addresses or emails; digests are not anonymization.

## Scrape work and provider budget

- A shared cache stores successful metadata for 15 minutes and unsuccessful extraction for 60 seconds. Keys include the authorized shop ID and the URL normalized by the URL parser, excluding fragments. Query parameters are preserved because they can identify different products.
- A URL lease prevents concurrent fetches for the same cache key. Duplicate in-flight requests receive a retry message; subsequent requests use the cached result.
- Four shared slot leases cap concurrent scrape jobs across all instances. A full pool rejects work immediately. Leases expire after 120 seconds if a worker dies, and owner tokens prevent an expired worker from releasing a replacement lease or publishing stale cache data.
- Each job has a 75-second abort deadline propagated to the direct and paid transports, shorter than its lease. Direct requests keep their five-second deadline; the paid request keeps its sixty-second deadline. Aborted jobs cannot start a later fallback request.
- Both transports keep their deadlines active through response-body consumption and accept only `text/html` or `application/xhtml+xml`. A shared streaming reader caps each HTML body at 2 MiB of received bytes (after Fetch decompression for ZenRows), regardless of `Content-Length`. Oversized, unsupported, and aborted bodies are canceled before parsing. A direct response rejected for size or content type does not trigger paid fallback; manual entry remains available.
- `ZENROWS_DAILY_REQUEST_LIMIT` limits paid request starts across all instances in a 24-hour window. The default is **100**; set **0** to disable paid fallback while retaining direct scraping and manual entry. All paid attempts are charged to the allowance before contacting ZenRows, including failed requests. They are never refunded. Invalid configuration stops paid requests.

The provider allowance is a request budget, not a currency amount. Set it to match the provider plan and configure the provider's own spending cap as well. No paid calls are made by the automated tests.

Expired counter, lease, and cache rows are pruned in batches of up to 1,000 per table on the first accepted global request of each new window. Expired data is never used even if no traffic arrives to trigger cleanup. All instances must share the same PostgreSQL database and policy configuration.

## Verification

`pnpm test:database` verifies atomic limits and leases with independent Prisma clients, including concurrent admission, expiry, cache reuse, duplicate suppression, capacity exhaustion, and rejection before registration hashing and paid-provider calls. Follow the disposable-database setup in [testing.md](testing.md). Unit and action tests cover trusted identities, account/guest quotas, storage failure, and retry messages.
