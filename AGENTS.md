<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TrueReview (iiwi) - Agent Guidelines

TrueReview (`iiwi`) is a verified Polish product review platform built with Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma (PostgreSQL), and NextAuth v4.

---

## 1. Package Manager & Verification Commands

The project uses **pnpm**. Always run verification before completing any task:

- `npx tsx scripts/verifyAgentRules.ts` — Architecture rule verification (must pass with 0 violations).
- `pnpm typecheck` — TypeScript type checking (`tsc --noEmit`).
- `pnpm lint` — ESLint verification (`eslint`).
- `pnpm test` — Full Vitest test suite (`vitest run`).
- `pnpm test:unit` — Unit test suite (`vitest run tests/unit`).
- `pnpm test:integration` — Integration test suite (`vitest run tests/integration`).
- `pnpm test:e2e` — Playwright end-to-end tests.
- `pnpm prisma:generate` / `pnpm prisma:migrate` — Prisma database tools.

---

## 2. Universal Core Rules (Applies to Every Task)

1. **Zero Comments Policy:**
   - Strictly forbidden to use any comments in source code, components, utilities, or test files. Enforced by AST.
   - Code must be self-descriptive through expressive naming, named helper functions, and named predicate functions (e.g. `isLoopbackIPv4()`).

2. **Zero Single-Letter & Cryptic Identifiers:**
   - Strictly forbidden to declare or use single-letter variable names (`d`, `p`, `r`, `e`, `res`) for domain models, draft objects, state, entities, handlers, or parameters.
   - All identifiers must explicitly communicate domain meaning (e.g. `savedDraft`, `product`, `rating`, `event`, `actionResult`).
   - *Allowed Exception:* Pure numeric counters in standard for-loops (`for (let i = 0; i < length; i++)`).

---

## 3. Specialized Architecture Guides

Read the relevant guide before starting a task in that area:

- [Component Architecture & ARIA Contracts](docs/components.md) — Base UI / shadcn first, colocation, props templates, accessible contracts (`role="meter"`, `data-state`).
- [Forms, State & Schemas](docs/forms-and-state.md) — React Hook Form + Zod, `useState` elimination, context value memoization, auth drafts.
- [Styling, Mobile & Performance](docs/styling-and-performance.md) — Tailwind v4 dynamic scale, mobile field islands, Core Web Vitals (LCP, CLS, INP, FCP).
- [Testing Standards](docs/testing.md) — Accessible semantic testing, error dictionaries, server action testing, hook testing.
