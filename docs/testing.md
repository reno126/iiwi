# Testing Standards & Conventions

## 1. Accessible Contract Testing

- Query elements by accessible semantic roles: `screen.getByRole("button")`, `screen.getByRole("meter")`.
- Assert accessible states: `toBeDisabled()`, `toHaveAccessibleName(...)`, `toHaveAttribute("aria-valuenow", ...)`, `toHaveAttribute("data-state", "filled")`.
- Strictly forbidden to query styling classes (`.form-item`, `.card-title`) or component slots (`[data-slot]`).

## 2. Single Source of Truth for Error Messages (No Magic Literals)

- Validation errors and UI copy:
  - Export validation error dictionaries from schemas (e.g. `PRODUCT_ERRORS`, `REVIEW_ERRORS`).
  - Export accessible UI text and label generators from components (e.g. `STAR_RATING_MESSAGES`).
  - In assertions, reference imported dictionary constants instead of raw magic strings.
- _Allowed Exception:_ Local mock test data created within the test arrangement (`arrange`) may be asserted directly as literals in `assert` (e.g. `<Component name="Stone" />; expect(screen.getByText("Stone")).toBeInTheDocument()`).

## 3. Direct Server Action Testing

- Test `next-safe-action` server actions directly as async functions.
- Assert `result.data`, `result.serverError`, and `result.validationErrors` without spinning up HTTP servers.

## 4. Hook Testing

- Isolate stateful hooks using `renderHook` from `@testing-library/react`.
- Use fake timers (`vi.useFakeTimers()`) to verify delay thresholds and timer cleanups.

## 5. PostgreSQL Regression Tests

Run `pnpm test:database` with `DATABASE_TEST_URL` explicitly set to a disposable local PostgreSQL database named `iiwi_ratings_test` or `iiwi_ci`. Apply the existing Prisma migrations to that database first, using the same URL as `DATABASE_URL` for `pnpm prisma:deploy`. This suite does not fall back to the application's database configuration. Fixtures use unique IDs and cleanup deletes only the user created by each test, cascading to its test products and reviews.

The suite calls the real review actions with authentication and cache invalidation mocked. PostgreSQL row locks synchronize concurrent submissions and repairs; assertions compare stored totals with database `COUNT`/`AVG`. CI runs it against its disposable PostgreSQL service before the production build.

Registration tests call the real route and synchronize two completed email lookups before either request can create an account. Both requests use PostgreSQL and real bcrypt hashing, while abuse limits are mocked. Assert one 201, one 409, and exactly one account, then delete only the fixture's unique generated email.

Every mutation of reviews for an existing product, including future edits and deletions, must use `withProductRatingLock` before changing reviews and `updateProductRating` before committing. The wrapper explicitly uses Read Committed isolation so aggregation after acquiring the lock sees the preceding writer's committed reviews. A newly created product is already isolated by its creating transaction. Rating reconstruction locks and commits one product at a time; a later failure leaves earlier products repaired, and rerunning the command is safe.

The same database suite tests [shared abuse controls](abuse-controls.md) with independent database clients. It uses no external scraping services. Run it against a dedicated disposable database without other application traffic; the suite owns its fixture keys and the global budget/slot keys it exercises.

Dashboard regression coverage seeds 102 reviews across 101 products and compares lifetime product averages, review counts, and shop totals with independent PostgreSQL aggregates. It checks user isolation and keeps unnamed shops separate by ID. The dashboard loads one aggregate per reviewed product rather than individual review rows; products are ordered by latest review, with product ID breaking ties.

## 6. Browser Test Database and Cleanup

Browser tests and `pnpm test:cleanup` require an explicit `E2E_DATABASE_URL`. There is no fallback to `DATABASE_URL` or application `.env` files. Only PostgreSQL on `localhost`, `127.0.0.1`, or `::1`, with database name `iiwi_e2e_test`, `iiwi_ratings_test`, or `iiwi_ci`, is accepted. URL query parameters and fragments are rejected. Use a disposable database without application traffic and apply the existing Prisma migrations before running tests.

PowerShell example after provisioning a disposable database:

```powershell
$env:E2E_DATABASE_URL = 'postgresql://ci:ci@127.0.0.1:5432/iiwi_ci'
$env:DATABASE_URL = $env:E2E_DATABASE_URL
pnpm prisma:deploy
pnpm test:e2e
```

Playwright generates and prints an `E2E_TEST_RUN_ID` UUID unless one was explicitly provided. It starts its own local application server with the same database URL, refuses to reuse an existing server, and uses `http://localhost:3000`. Remote base URL overrides are not supported. CI supplies its disposable PostgreSQL URL explicitly.

Test helpers record exact user IDs in `.e2e-runs/<run-id>.jsonl`, bound to the run ID and a hash of the database connection string. Fixture user IDs are recorded before insertion. The registration browser test records the server-generated ID during teardown after looking up its unique generated email. If the process is forcibly terminated before that ID is recorded, the account is deliberately left untouched by automated cleanup.

Normal teardown deletes recorded user IDs, with database cascades removing their dependent records. Cleanup never selects by name, code, or email prefix. To retry cleanup for a completed or interrupted run, retain its manifest and supply its printed UUID and the same database connection string:

```powershell
$env:E2E_TEST_RUN_ID = '<UUID printed by the browser test run>'
pnpm test:cleanup
```

Missing, malformed, or mismatched manifests are rejected before creating a database client. Manifests are kept for safe, idempotent retries; changing the connection string requires restoring the original connection settings rather than bypassing the guard. Cleanup is only for disposable databases and must run after the selected run's workers have stopped. Legacy untracked fixtures are not swept; recreate the disposable database if needed.

Regression tests verify rejection before database access, manifest isolation, safe repeat cleanup, and survival of ordinary `test_`, `dup_`, and `__test__` accounts and their products/reviews in PostgreSQL.
